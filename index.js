(function () {
    const get = t => eval(`typeof ${t} !== "undefined" ? ${t} : null`);
    const global_ = get("self") || get("global") || this;
    const module_ = get("module");
    const require_ = get("require");

    const Buffer = global_.Buffer || require("buffer").Buffer;
    if (!("Buffer" in global_)) global_.Buffer = Buffer;

    const inspect = global_.util || (require_ ? r => require_("util").inspect(r) : r => JSON.stringify(r));

    const nameSymbol = Symbol("BinName");
    const structSymbol = Symbol("BinStruct");

    function baseAssert(val, bool) {
        if (!bool) return `Invalid value(${inspect(val)})`;
    }

    const warns = {};

    function warnOnce(msg) {
        if (!warns[msg]) {
            warns[msg] = true;
            console.warn(msg);
        }
    }

    const writeFnMatch = {1: "writeUint8", 2: "writeUint16LE", 4: "writeUint32LE", 8: "writeBigUint64LE"};
    const readFnMatch = {1: "readUint8", 2: "readUint16LE", 4: "readUint32LE", 8: "readBigUint64LE"};

    class BinJS {
        _id = 1;

        constructor({classes = [], constantList = []} = {}) {
            this.bins = [];
            this.constantList = [];
            this.classes = [];
            this.__registerBuiltInBins();
            this.setOptions({classes, constantList});
        };

        setOptions({classes = [], constantList = []} = {}) {
            this.classes.length = 0;
            this.constantList.length = 0;
            classes.forEach(i => {
                const ar = Array.isArray(i);
                const clazz = ar ? i[0] : i;
                this.classes.push([clazz, (ar && i[1]) || (obj => {
                    const instance = new clazz();
                    for (const k in obj) if (k !== "constructor") instance[k] = obj[k];
                    return instance;
                })]);
            });
            this.constantList.push(...constantList);
            return this;
        };

        new({classes = [], constantList = []} = {}) {
            return new BinJS({classes, constantList});
        };

        valueToBinId(value) {
            if (value === true) return this.trueId;
            if (value === false) return this.falseId;
            if (value === null) return this.nullId;
            if (value === undefined) return this.undefinedId;
            if (typeof value === "number") {
                if (isNaN(value)) return this.nanId;
                if (value === Infinity) return this.posInfinityId;
                if (value === -Infinity) return this.negInfinityId;
                if (value === 0) return this.zeroId;
                if (value % 1 === 0) {
                    if (value >= 0) {
                        if (value <= 127) return this.u8id;
                        if (value <= 32767) return this.u16id;
                        if (value <= 2147483647) return this.u32id;
                    } else {
                        if (value >= -128) return this.i8id;
                        if (value >= -32768) return this.i16id;
                        if (value >= -2147483648) return this.i32id;
                    }
                    throw new Error("Number out of range");
                }
                const FLOAT32_MAX = 3.4028235e38;
                const FLOAT32_MIN = -3.4028235e38;
                const FLOAT32_SMALLEST_POSITIVE = 1.4e-45;

                if ((value >= FLOAT32_SMALLEST_POSITIVE || value === 0) && value <= FLOAT32_MAX && value >= FLOAT32_MIN) {
                    return this.f32id;
                }
                return this.f64id;
            }
            if (typeof value === "bigint") {
                if (value === 0n) return this.zeroNId;
                return value < 0n ? this.bigintNegId : this.bigintPosId;
                /*if (value > 0n) {
                    if (value > 9223372036854775807n) return this.bigintPosId;
                    return this.u64id;
                }
                if (value < -9223372036854775808n) return this.bigintNegId;
                return this.i64id;*/
            }
            if (typeof value === "string") {
                if (value.length <= 255) return this.string8id;
                if (value.length <= 65535) return this.string16id;
                if (value.length <= 4294967295) return this.string32id;
                throw new Error("String too long"); // Impossible, but just in case.
            }
            if (Array.isArray(value)) return this.arrayId;
            if (value instanceof Date) return this.dateId;
            if (value instanceof Map) return this.mapId;
            if (value instanceof Set) return this.setId;
            if (value instanceof Uint8Array) return this.u8arrayId;
            if (value instanceof Uint16Array) return this.u16arrayId;
            if (value instanceof Uint32Array) return this.u32arrayId;
            if (value instanceof BigUint64Array) return this.u64arrayId;
            if (value instanceof Int8Array) return this.i8arrayId;
            if (value instanceof Int16Array) return this.i16arrayId;
            if (value instanceof Int32Array) return this.i32arrayId;
            if (value instanceof BigInt64Array) return this.i64arrayId;
            if (value instanceof Float32Array) return this.f32arrayId;
            if (value instanceof Float64Array) return this.f64arrayId;
            if (typeof value === "object") return value.constructor === Object ? this.objectId : this.classId;

            return this.constantId;
        };

        getTypeOf(value) {
            return this.bins[this.valueToBinId(value)];
        };

        serialize(value) {
            const id = this.valueToBinId(value);
            const buffer = Buffer.allocUnsafe(this.bins[id].getSize(value) + 1);
            buffer[0] = id;
            this.bins[id].write(buffer, [1], value);
            return buffer;
        };

        deserialize(buffer) {
            return this.bins[buffer[0]].read(buffer, [1]);
        };

        getSize(value) {
            return this.getTypeOf(value).getSize(value);
        };

        makeBin(name, write, read, size, validate, sample) {
            return {
                [nameSymbol]: name, write(buffer, index, value, ...args) {
                    this.assert(value, ...args);
                    write(buffer, index, value, ...args);
                    return buffer;
                }, _write: write, read, getSize: size, validate, assert: (...args) => {
                    const err = validate(...args);
                    if (err) throw new Error(name + (err[0] === "[" ? "" : ": ") + err);
                }, serialize(value, ...args) {
                    this.assert(value, ...args);
                    const buffer = Buffer.allocUnsafe(this.getSize(value));
                    write(buffer, [0], value, ...args);
                    return buffer;
                },
                deserialize(buffer, ...args) {
                    return this.read(buffer, [0], ...args);
                }, makeSample: sample
            }
        };

        registerBin(name, write, read, size, validate, sample) {
            const id = this._id++;
            if (id > 255) throw new Error("Too many bins");
            this.bins[id] = this.makeBin(name, write, read, size, validate, sample);
            return id;
        };

        __registerBuiltInBins() {
            this.breakId = this._id++;
            this.null = this.bins[this.nullId = this.registerBin(
                "null",
                () => null,
                () => null,
                () => 0,
                () => null,
                () => null
            )];
            this.undefined = this.bins[this.undefinedId = this.registerBin(
                "undefined",
                () => undefined,
                () => undefined,
                () => 0,
                () => null,
                () => undefined
            )];
            this.true = this.bins[this.trueId = this.registerBin(
                "true",
                () => true,
                () => true,
                () => 0,
                () => null,
                () => true
            )];
            this.false = this.bins[this.falseId = this.registerBin(
                "false",
                () => false,
                () => false,
                () => 0,
                () => null,
                () => false
            )];
            this.nan = this.bins[this.nanId = this.registerBin(
                "NaN",
                () => NaN,
                () => NaN,
                () => 0,
                () => null,
                () => NaN
            )];
            this.posInfinity = this.bins[this.posInfinityId = this.registerBin(
                "+Infinity",
                () => Infinity,
                () => Infinity,
                () => 0,
                () => null,
                () => Infinity
            )];
            this.negInfinity = this.bins[this.negInfinityId = this.registerBin(
                "-Infinity",
                () => -Infinity,
                () => -Infinity,
                () => 0,
                () => null,
                () => -Infinity
            )];
            this.zero = this.bins[this.zeroId = this.registerBin(
                "0",
                () => 0,
                () => 0,
                () => 0,
                () => null,
                () => 0
            )];
            this.zeroN = this.bins[this.zeroNId = this.registerBin(
                "0n",
                () => 0n,
                () => 0n,
                () => 0,
                () => null,
                () => 0n
            )];

            this.u8 = this.bins[this.u8id = this.registerBin(
                "u8",
                (buffer, index, value) => buffer[index[0]++] = value,
                (buffer, index) => buffer[index[0]++],
                () => 1,
                v => baseAssert(v, typeof v === "number" && !isNaN(v) && v >= 0 && v <= 255),
                () => 0
            )];
            this.u16 = this.bins[this.u16id = this.registerBin(
                "u16",
                (buffer, index, value) => {
                    buffer.writeUInt16LE(value, index[0]);
                    index[0] += 2;
                },
                (buffer, index) => {
                    const value = buffer.readUInt16LE(index[0]);
                    index[0] += 2;
                    return value;
                },
                () => 2,
                v => baseAssert(v, typeof v === "number" && !isNaN(v) && v >= 0 && v <= 65535),
                () => 0
            )];
            this.u32 = this.bins[this.u32id = this.registerBin(
                "u32",
                (buffer, index, value) => {
                    buffer.writeUInt32LE(value, index[0]);
                    index[0] += 4;
                },
                (buffer, index) => {
                    const value = buffer.readUInt32LE(index[0]);
                    index[0] += 4;
                    return value;
                },
                () => 4,
                v => baseAssert(v, typeof v === "number" && !isNaN(v) && v >= 0 && v <= 4294967295),
                () => 0
            )];
            this.u64 = this.bins[this.u64id = this.registerBin(
                "u64",
                (buffer, index, value) => {
                    buffer.writeBigUInt64LE(BigInt(value), index[0]);
                    index[0] += 8;
                },
                (buffer, index) => {
                    const value = BigInt(buffer.readBigUInt64LE(index[0]));
                    index[0] += 8;
                    return value;
                },
                () => 8,
                v => baseAssert(v, typeof v === "bigint" && v >= 0n && v <= 18446744073709551615n),
                () => 0
            )];
            this.i8 = this.bins[this.i8id = this.registerBin(
                "i8",
                (buffer, index, value) => buffer[index[0]++] = value + 128,
                (buffer, index) => buffer[index[0]++] - 128,
                () => 1,
                v => baseAssert(v, typeof v === "number" && !isNaN(v) && v >= -128 && v <= 127),
                () => 0
            )];
            this.i16 = this.bins[this.i16id = this.registerBin(
                "i16",
                (buffer, index, value) => {
                    buffer.writeInt16LE(value, index[0]);
                    index[0] += 2;
                },
                (buffer, index) => {
                    const value = buffer.readInt16LE(index[0]);
                    index[0] += 2;
                    return value;
                },
                () => 2,
                v => baseAssert(v, typeof v === "number" && !isNaN(v) && v >= -32768 && v <= 32767),
                () => 0
            )];
            this.i32 = this.bins[this.i32id = this.registerBin(
                "i32",
                (buffer, index, value) => {
                    buffer.writeInt32LE(value, index[0]);
                    index[0] += 4;
                },
                (buffer, index) => {
                    const value = buffer.readInt32LE(index[0]);
                    index[0] += 4;
                    return value;
                },
                () => 4,
                v => baseAssert(v, typeof v === "number" && !isNaN(v) && v >= -2147483648 && v <= 2147483647),
                () => 0
            )];
            this.i64 = this.bins[this.i64id = this.registerBin(
                "i64",
                (buffer, index, value) => {
                    buffer.writeBigInt64LE(value, index[0]);
                    index[0] += 8;
                },
                (buffer, index) => {
                    const value = buffer.readBigInt64LE(index[0]);
                    index[0] += 8;
                    return value;
                },
                () => 8,
                v => baseAssert(v, typeof v === "bigint" && v >= -9223372036854775808n && v <= 9223372036854775807n),
                () => 0
            )];
            this.f32 = this.bins[this.f32id = this.registerBin(
                "f32",
                (buffer, index, value) => {
                    buffer.writeFloatLE(value, index[0]);
                    index[0] += 4;
                },
                (buffer, index) => {
                    const value = buffer.readFloatLE(index[0]);
                    index[0] += 4;
                    return value;
                },
                () => 4,
                v => baseAssert(v, typeof v === "number" && !isNaN(v) && v >= -3.4028234663852886e+38 && v <= 3.4028234663852886e+38),
                () => 0
            )];
            this.f64 = this.bins[this.f64id = this.registerBin(
                "f64",
                (buffer, index, value) => {
                    buffer.writeDoubleLE(value, index[0]);
                    index[0] += 8;
                },
                (buffer, index) => {
                    const value = buffer.readDoubleLE(index[0]);
                    index[0] += 8;
                    return value;
                },
                () => 8,
                v => baseAssert(v, typeof v === "number" && !isNaN(v) && v >= -1.7976931348623157e+308 && v <= 1.7976931348623157e+308),
                () => 0
            )];
            this.bigintPos = this.bins[this.bigintPosId = this.registerBin(
                "+bigint",
                (buffer, index, value) => {
                    let hex = BigInt(value).toString(16);
                    if (hex.length % 2 === 1) hex = "0" + hex;
                    const arr = Buffer.from(hex, "hex");

                    buffer.writeUint16LE(arr.length, index[0]);
                    index[0] += 2;
                    arr.copy(buffer, index[0]);
                    index[0] += arr.length;
                },
                (buffer, index) => {
                    const length = buffer.readUint16LE(index[0]);
                    index[0] += 2;
                    let value = BigInt("0x" + buffer.toString("hex", index[0], index[0] + length));
                    index[0] += length;
                    return value;
                },
                value => {
                    let hex = value.toString(16);
                    if (hex.length % 2 === 1) hex = "0" + hex;
                    return hex.length / 2 + 2;
                },
                v => baseAssert(v, typeof v === "bigint" && v > 0n),
                () => 1n
            )];
            this.bigintNeg = this.bins[this.bigintNegId = this.registerBin(
                "-bigint",
                (buffer, index, value) => this.bigintPos.write(buffer, index, -value),
                (buffer, index) => -this.bigintPos.read(buffer, index, 0),
                value => this.bigintPos.getSize(-value),
                v => baseAssert(v, typeof v === "bigint" && v < 0n),
                () => -1n
            )];

            this.string8 = this.bins[this.string8id = this.registerBin(
                "string8",
                (buffer, index, value) => {
                    const buf = Buffer.from(value, "utf8");
                    buffer[index[0]++] = buf.length;
                    buf.copy(buffer, index[0]);
                    index[0] += buf.length;
                },
                (buffer, index) => {
                    const length = buffer[index[0]++];
                    const value = buffer.toString("utf8", index[0], index[0] + length);
                    index[0] += length;
                    return value;
                },
                value => Buffer.byteLength(value, "utf8") + 1,
                v => baseAssert(v, typeof v === "string" && Buffer.byteLength(v, "utf8") <= 255),
                () => ""
            )];
            this.string16 = this.bins[this.string16id = this.registerBin(
                "string16",
                (buffer, index, value) => {
                    const buf = Buffer.from(value, "utf8");
                    buffer.writeUInt16LE(buf.length, index[0]);
                    index[0] += 2;
                    buf.copy(buffer, index[0]);
                    index[0] += buf.length;
                },
                (buffer, index) => {
                    const length = buffer.readUInt16LE(index[0]);
                    index[0] += 2;
                    const value = buffer.toString("utf8", index[0], index[0] + length);
                    index[0] += length;
                    return value;
                },
                value => Buffer.byteLength(value, "utf8") + 2,
                v => baseAssert(v, typeof v === "string" && Buffer.byteLength(v, "utf8") <= 65535),
                () => ""
            )];
            this.string32 = this.bins[this.string32id = this.registerBin(
                "string32",
                (buffer, index, value) => {
                    const buf = Buffer.from(value, "utf8");
                    buffer.writeUInt32LE(buf.length, index[0]);
                    index[0] += 4;
                    buf.copy(buffer, index[0]);
                    index[0] += buf.length;
                },
                (buffer, index) => {
                    const length = buffer.readUInt32LE(index[0]);
                    index[0] += 4;
                    const value = buffer.toString("utf8", index[0], index[0] + length);
                    index[0] += length;
                    return value;
                },
                value => Buffer.byteLength(value, "utf8") + 4,
                v => baseAssert(v, typeof v === "string" && Buffer.byteLength(v, "utf8") <= 4294967295),
                () => ""
            )];
            this.string = this.bins[this.stringId = this.registerBin(
                "string",
                (buffer, index, value) => {
                    const buf = Buffer.from(value, "utf8");
                    for (let i = 0; i < buf.length; i++) {
                        buffer[index[0]++] = buf[i];
                        if (buf[i] === 0) {
                            buffer[index[0]++] = 0;
                        }
                    }

                    buffer[index[0]++] = 0;
                },
                (buffer, index) => {
                    const buf = [];
                    while (true) {
                        if (buffer[index[0]] === 0 && buffer[index[0] + 1] !== 0) break;
                        if (buffer[index[0]] === 0) index[0]++;
                        buf.push(buffer[index[0]++]);
                    }
                    index[0]++;
                    return Buffer.from(buf).toString("utf8");
                },
                value => {
                    const buf = Buffer.from(value, "utf8");
                    let size = buf.length + 1;
                    for (let i = 0; i < buf.length; i++) {
                        if (buf[i] === 0) size++;
                    }
                    return size;
                },
                v => baseAssert(v, typeof v === "string"),
                () => ""
            )]

            this.array = this.bins[this.arrayId = this.registerBin(
                "array",
                (buffer, index, value) => {
                    for (let i = 0; i < value.length; i++) {
                        const item = value[i];
                        const id = this.valueToBinId(item);
                        buffer[index[0]++] = id;
                        this.bins[id]._write(buffer, index, item);
                    }
                    buffer[index[0]++] = this.breakId;
                },
                (buffer, index) => {
                    const value = [];
                    while (true) {
                        if (buffer[index[0]] === this.breakId) break;
                        const item = this.bins[buffer[index[0]++]].read(buffer, index);
                        value.push(item);
                    }
                    index[0]++;
                    return value;
                },
                (value) => {
                    return 1 + value.reduce((sum, item) => sum + this.getSize(item) + 1, 0);
                },
                v => {
                    if (!Array.isArray(v)) return "Expected an array";
                },
                () => []
            )];

            const addArrayProps = (array, clazz = Array, convert = r => r) => {
                array.typed = (type, fixedLength = null, lengthBytes = 2) => {
                    const readFn = readFnMatch[lengthBytes];
                    const writeFn = writeFnMatch[lengthBytes];
                    const bin = this.makeBin(
                        `${array[nameSymbol]}<${type[nameSymbol]}>`,
                        (buffer, index, value) => {
                            // I used length because if I don"t, this causes a bug: [1, 2, 3], resulting in a buffer that starts with the array break byte.
                            let length = value.length;
                            if (fixedLength === null) {
                                if (lengthBytes === 8) length = BigInt(length);
                                buffer[writeFn](length, index[0]);
                                index[0] += lengthBytes;
                            }
                            for (let i = 0; i < value.length; i++) {
                                const item = value[i];
                                type._write(buffer, index, item);
                            }
                        },
                        (buffer, index) => {
                            let length = fixedLength;
                            if (length === null) {
                                length = Number(buffer[readFn](index[0]));
                                index[0] += lengthBytes;
                            }
                            const value = [];
                            for (let i = 0; i < length; i++) {
                                value[i] = type.read(buffer, index);
                            }
                            return convert(value);
                        },
                        value => (fixedLength === null ? lengthBytes : 0) + value.reduce((sum, item) => sum + type.getSize(item), 0),
                        v => {
                            if (!(v instanceof clazz)) return `Expected an instance of ${clazz.name}`;
                            if (fixedLength !== null && v.length !== fixedLength) return `Expected an array of length ${fixedLength}`;
                            for (let i = 0; i < v.length; i++) {
                                const item = v[i];
                                const err = type.validate(item);
                                if (err) return `[${i}]${err[0] === "[" ? "" : ": "}${err}`;
                            }
                        },
                        () => []
                    );
                    bin.typed = () => {
                        warnOnce("array.typed().typed() is a no-op. To remove this warning please do just use array.typed()");
                        return array.typed(length);
                    };
                    bin.struct = () => {
                        throw new Error("The use of array.typed().struct() does not make sense. Use array.typed() or array.struct() instead.");
                    };
                    return bin;
                };
                array.struct = types => {
                    const bin = this.makeBin(
                        `[${types.map(t => t[nameSymbol]).join(", ")}]`,
                        (buffer, index, value) => {
                            for (let i = 0; i < types.length; i++) {
                                const type = types[i];
                                type._write(buffer, index, value[i]);
                            }
                        },
                        (buffer, index) => {
                            const value = [];
                            for (let i = 0; i < types.length; i++) {
                                const type = types[i];
                                value[i] = type.read(buffer, index);
                            }
                            return value;
                        },
                        value => value.reduce((sum, item, i) => sum + types[i].getSize(item), 0),
                        v => {
                            if (!(v instanceof clazz)) return `Expected an instance of ${clazz.name}`;
                            if (v.length !== types.length) return `Expected ${types.length} items, but got ${v.length}`;
                            for (let i = 0; i < v.length; i++) {
                                const item = v[i];
                                const err = types[i].validate(item);
                                if (err) return `[${i}]${err[0] === "[" ? "" : ": "}${err}`;
                            }
                        },
                        () => types.map(t => t.makeSample())
                    );
                    bin.typed = () => {
                        throw new Error("The use of .struct().typed() is invalid.");
                    };
                    bin.struct = () => {
                        throw new Error("The use of .struct().struct() is invalid.");
                    };
                    return bin;
                };
                return array;
            };
            addArrayProps(this.array);

            this.setId = 0;
            this.u8clampedArrayId = 0;
            this.u8arrayId = 0;
            this.u16arrayId = 0;
            this.u32arrayId = 0;
            this.u64arrayId = 0;
            this.i8arrayId = 0;
            this.i16arrayId = 0;
            this.i32arrayId = 0;
            this.i64arrayId = 0;
            this.f32arrayId = 0;
            this.f64arrayId = 0;
            this.arrayBufferId = 0;

            for (const [name1, name2, clazz, type] of [
                ["set", "setId", Set],
                ["u8clampedArray", "u8clampedArrayId", Uint8ClampedArray, this.u8],
                ["u8array", "u8arrayId", Uint8Array, this.u8],
                ["u16array", "u16arrayId", Uint16Array, this.u16],
                ["u32array", "u32arrayId", Uint32Array, this.u32],
                ["u64array", "u64arrayId", BigUint64Array, this.u64],
                ["i8array", "i8arrayId", Int8Array, this.i8],
                ["i16array", "i16arrayId", Int16Array, this.i16],
                ["i32array", "i32arrayId", Int32Array, this.i32],
                ["i64array", "i64arrayId", BigInt64Array, this.i64],
                ["f32array", "f32arrayId", Float32Array, this.f32],
                ["f64array", "f64arrayId", Float64Array, this.f64],
                ["arrayBuffer", "arrayBufferId", ArrayBuffer, this.u8]
            ]) {
                addArrayProps(this[name1] = this.bins[this[name2] = this.registerBin(
                    clazz.name,
                    (buffer, index, value) => {
                        this.array._write(buffer, index, [...value]);
                    },
                    (buffer, index) => {
                        return new clazz(this.array.read(buffer, index));
                    },
                    value => this.array.getSize([...value]),
                    value => this.array.validate([...value]),
                    () => new clazz(this.array.makeSample())
                )], clazz, v => new clazz(v));
                if (type) {
                    const original = this[name1];
                    const bin = this[name1] = original.typed(type);
                    bin.fixed = (length, lengthBytes = 2) => original.typed(type, length, lengthBytes);
                }
            }

            this.object = this.bins[this.objectId = this.registerBin(
                "object",
                (buffer, index, value, condition = () => true) => {
                    for (const [key, item] of Object.entries(value)) {
                        if (!condition(item)) continue;
                        this.string._write(buffer, index, key);
                        const id = this.valueToBinId(item);
                        buffer[index[0]++] = id;
                        this.bins[id]._write(buffer, index, item);
                    }
                    buffer[index[0]++] = this.breakId;
                },
                (buffer, index) => {
                    const obj = {};
                    while (true) {
                        if (buffer[index[0]] === this.breakId) break;
                        obj[this.string.read(buffer, index)] = this.bins[buffer[index[0]++]].read(buffer, index);
                    }
                    index[0]++;
                    return obj;
                },
                (value, condition = () => true) => {
                    return 1 + Object.entries(value).reduce((sum, [key, item]) =>
                        sum + (condition(item) && this.string.getSize(key) + this.getSize(item) + 1), 0);
                },
                (v, clazz = Object) => {
                    if (v === null || typeof v !== "object") return "Invalid object";
                    if (v.constructor !== clazz && (clazz !== Object || !v[structSymbol])) {
                        return clazz === Object ? "Expected a raw object" : `Expected an instance of ${clazz.name}`;
                    }
                },
                (constructor = r => r) => constructor({})
            )];
            const classCheck = item => typeof item !== "function" || this.constantList.includes(item);
            const addClassProp = base => {
                base.class = (clazz, constructor) => {
                    constructor ||= obj => {
                        const instance = new clazz();
                        for (const k in obj) if (k !== "constructor") instance[k] = obj[k];
                        return instance;
                    };
                    const bin = this.makeBin(
                        clazz.name,
                        (buffer, index, value) => base._write(buffer, index, value, classCheck),
                        (buffer, index) => constructor(base.read(buffer, index)),
                        value => base.getSize(value, classCheck),
                        v => base.validate(v, clazz, classCheck),
                        () => base.makeSample(constructor)
                    );
                    bin.class = () => {
                        throw new Error("The use of .class().class() is invalid");
                    };
                    bin.struct = (...args) => {
                        return base.struct(...args).class(clazz, constructor);
                    };
                    bin.typed = () => {
                        throw new Error("The use of .class().typed() is invalid. Try doing .typed().class() instead.");
                    };
                    return bin;
                };
                return base;
            };
            addClassProp(this.object);
            this.object.typed = (type, fixedLength = null, lengthBytes = 2) => {
                const readFn = readFnMatch[lengthBytes];
                const writeFn = writeFnMatch[lengthBytes];
                return addClassProp(this.makeBin(
                    `object<string, ${type[nameSymbol]}>`,
                    (buffer, index, value, condition = () => true) => {
                        const entries = Object.entries(value).filter(i => condition(i[1]));

                        if (fixedLength === null) {
                            // I used length because if I don"t, this causes a bug: {"\x01": "hi"}, resulting in a buffer that starts with the object break byte.
                            let length = entries.length;
                            if (lengthBytes === 8) length = BigInt(length);
                            buffer[writeFn](length, index[0]);
                            index[0] += lengthBytes;
                        }

                        for (const [key, item] of entries) {
                            this.string._write(buffer, index, key);
                            type._write(buffer, index, item);
                        }
                    },
                    (buffer, index) => {
                        let length = fixedLength;
                        if (length === null) {
                            length = Number(buffer[readFn](index[0]));
                            index[0] += lengthBytes;
                        }
                        const value = {};
                        for (let i = 0; i < length; i++) {
                            value[this.string.read(buffer, index)] = type.read(buffer, index);
                        }
                        return value;
                    },
                    (value, condition = () => true) => {
                        return (fixedLength === null ? lengthBytes : 0) + Object.entries(value).reduce((sum, [key, item]) =>
                            sum + (condition(item) && this.string.getSize(key) + type.getSize(item)), 0);
                    },
                    (v, clazz = Object, condition = () => true) => {
                        if (v === null || typeof v !== "object") return "Invalid object";
                        if (v.constructor !== clazz && (clazz !== Object || !v[structSymbol])) {
                            return clazz === Object ? "Expected a raw object" : `Expected an instance of ${clazz.name}`;
                        }
                        for (const [key, item] of Object.entries(v)) {
                            if (!condition(item)) continue;
                            const err = type.validate(item);
                            if (err) return `[${JSON.stringify(key)}]${err[0] === "[" ? "" : ": "}${err}`;
                        }
                    },
                    this.object.makeSample
                ));
            };
            this.object.struct = obj => {
                if (typeof obj !== "object") throw new Error("Expected an object for the struct definition");
                if (obj.constructor !== Object) throw new Error("Expected an object for the struct definition");
                const struct = Object.entries(obj)
                    .sort((a, b) => a[0].localeCompare(b[0]))
                    .map(([key, type]) => {
                        if (typeof type === "object" && !type[nameSymbol]) return [key, this.object.struct(type)];
                        return [key, type];
                    });
                for (const [key, type] of struct) {
                    if ((typeof type !== "function" && typeof type !== "object") || type === null || !type[nameSymbol]) {
                        throw new Error("Invalid struct type at the key: " + key);
                    }
                }
                const binData = addClassProp(this.makeBin(
                    `{${struct.map(([key, type]) => `${JSON.stringify(key)}: ${type[nameSymbol]}`).join(", ")}}`,
                    (buffer, index, value) => {
                        for (const [key, type] of struct) {
                            type._write(buffer, index, value[key]);
                        }
                    },
                    (buffer, index) => {
                        const value = {};
                        for (const [key, type] of struct) {
                            value[key] = type.read(buffer, index);
                        }
                        return value;
                    },
                    value => struct.reduce((sum, [key, type]) => sum + type.getSize(value[key]), 0),
                    (v, clazz = Object) => {
                        if (v === null || typeof v !== "object") return "Invalid object";
                        if (v.constructor !== clazz && (clazz !== Object || !v[structSymbol])) {
                            return clazz === Object ? "Expected a raw object" : `Expected an instance of ${clazz.name}`;
                        }

                        for (const [key, type] of struct) {
                            const err = type.validate(v[key]);
                            if (err) return `[${JSON.stringify(key)}]${err[0] === "[" ? "" : ": "}${err}`;
                        }
                    },
                    (constructor = r => r) => {
                        const obj = {};
                        for (const [key, type] of struct) {
                            obj[key] = type.makeSample();
                        }
                        return constructor(obj);
                    }
                ));
                const structKeys = struct.map(i => i[0]);
                const classKeys = ["getSize", "validate", "buffer", structSymbol];
                const canInstantiate = classKeys.every(i => !structKeys.includes(i));
                const Struct = function () {
                    if (!canInstantiate) throw new Error("Cannot instantiate this struct because it includes the following properties: " + classKeys.filter(i => structKeys.includes(i)).join(", "));
                    if (!(this instanceof Struct)) return new Struct();
                    this.getSize = () => binData.getSize(this);
                    this.validate = () => binData.validate(this);
                    this.assert = () => binData.assert(this);
                    Object.defineProperty(this, "buffer", {
                        get: () => binData.serialize(this),
                        set: buffer => {
                            const dat = binData.deserialize(buffer);
                            for (const [key] of struct) {
                                this[key] = dat[key];
                            }
                        }
                    });
                    for (const [key, type] of struct) {
                        this[key] = type.makeSample();
                    }
                    this[structSymbol] = true;
                    return this;
                };
                Object.assign(Struct, binData);
                return Struct;
            };
            this.object.structClass = (sample, constructor) => {
                const obj = {};
                for (const [key, item] of Object.entries(sample)) {
                    if (!classCheck(item)) continue;
                    obj[key] = this.getTypeOf(item);
                }
                return this.object.struct(obj).class(sample.constructor, constructor);
            };

            this.map = this.bins[this.mapId = this.registerBin(
                "map",
                (buffer, index, value) => {
                    for (const [key, item] of [...value]) {
                        const id1 = this.valueToBinId(key);
                        buffer[index[0]++] = id1;
                        this.bins[id1]._write(buffer, index, key);

                        const id2 = this.valueToBinId(item);
                        buffer[index[0]++] = id2;
                        this.bins[id2]._write(buffer, index, item);
                    }
                    buffer[index[0]++] = this.breakId;
                },
                (buffer, index) => {
                    const value = new Map;
                    while (true) {
                        if (buffer[index[0]] === this.breakId) break;
                        value.set(this.bins[buffer[index[0]++]].read(buffer, index), this.bins[buffer[index[0]++]].read(buffer, index));
                    }
                    index[0]++;
                    return value;
                },
                value => {
                    return 1 + [...value].reduce((sum, [key, item]) => sum + this.getSize(key) + this.getSize(item) + 2, 0);
                },
                v => {
                    if (v === null || typeof v !== "object" || !(v instanceof Map)) return "Expected an instance of Map";
                },
                () => new Map
            )];
            this.map.typed = (keyType, valueType, lengthBytes = 2) => {
                const readFn = readFnMatch[lengthBytes];
                const writeFn = writeFnMatch[lengthBytes];
                return addClassProp(this.makeBin(
                    `map<${keyType[nameSymbol]}, ${valueType[nameSymbol]}>`,
                    (buffer, index, value) => {
                        // I used length because if I don"t, this causes a bug: new Map([[1, 2]]), resulting in a buffer that starts with the map break byte.
                        const val = [...value];
                        let length = val.length;
                        if (lengthBytes === 8) length = BigInt(length);
                        buffer[writeFn](length, index[0]);
                        index[0] += lengthBytes;
                        for (const [key, item] of val) {
                            keyType._write(buffer, index, key);
                            valueType._write(buffer, index, item);
                        }
                    },
                    (buffer, index) => {
                        const length = Number(buffer[readFn](index[0]));
                        index[0] += lengthBytes;
                        const value = new Map;
                        for (let i = 0; i < length; i++) {
                            value.set(keyType.read(buffer, index), valueType.read(buffer, index));
                        }
                        return value;
                    },
                    value => lengthBytes + [...value].reduce((sum, [key, item]) => sum + keyType.getSize(key) + valueType.getSize(item), 0),
                    v => {
                        if (v === null || typeof v !== "object" || !(v instanceof Map)) return "Expected an instance of Map";

                        for (const [key, item] of v) {
                            let err = keyType.validate(key);
                            if (err) return `[${inspect(key)}][key]${err[0] === "[" ? "" : ": "}${err}`;

                            err = valueType.validate(item);
                            if (err) return `[${inspect(key)}][value]${err[0] === "[" ? "" : ": "}${err}`;
                        }
                    },
                    () => new Map
                ));
            };

            this.date = this.bins[this.dateId = this.registerBin(
                "date",
                (buffer, index, value) => {
                    buffer.writeBigInt64LE(BigInt(value.getTime()), index[0]);
                    index[0] += 8;
                },
                (buffer, index) => {
                    const value = new Date(Number(buffer.readBigInt64LE(index[0])));
                    index[0] += 8;
                    return value;
                },
                () => 8,
                v => {
                    if (v === null || typeof v !== "object" || !(v instanceof Date)) return "Expected an instance of Date";
                },
                () => new Date(0)
            )];


            this.class = this.bins[this.classId = this.registerBin(
                "class",
                (buffer, index, value) => {
                    const classId = this.classes.findIndex(i => i[0] === value.constructor);
                    buffer.writeUint16LE(classId, index[0]);
                    index[0] += 2;
                    this.object._write(buffer, index, value, classCheck);
                },
                (buffer, index) => {
                    const classId = buffer.readUint16LE(index[0]);
                    index[0] += 2;
                    return this.classes[classId][1](this.object.read(buffer, index));
                },
                value => this.object.getSize(value, classCheck) + 2,
                v => {
                    if (v === null || typeof v !== "object") return "Expected an instance of a class";
                    if (!this.classes.some(i => i[0] === v.constructor)) return `Unknown class: ${v.constructor.name}`;
                },
                () => null
            )];

            this.constant = this.bins[this.constantId = this.registerBin(
                "constant",
                (buffer, index, value) => {
                    const constantId = this.constantList.indexOf(value);
                    buffer.writeUint16LE(constantId, index[0]);
                    index[0] += 2;
                },
                (buffer, index) => {
                    const constantId = buffer.readUint16LE(index[0]);
                    index[0] += 2;
                    return this.constantList[constantId];
                },
                () => 2,
                v => {
                    if (!this.constantList.includes(v)) return `Unknown constant: ${inspect(v)}`;
                },
                () => null
            )];

            this.bool = this.boolean = this.bins[this.booleanId = this.registerBin(
                "bool",
                (buffer, index, value) => {
                    buffer[index[0]++] = value ? 1 : 0;
                },
                (buffer, index) => {
                    return buffer[index[0]++] === 1;
                },
                () => 1,
                v => {
                    if (typeof v !== "boolean") return "Expected a boolean";
                },
                () => false
            )];

            this.any = this.bins[this.anyId = this.registerBin(
                "any",
                (buffer, index, value) => {
                    const binId = this.valueToBinId(value);
                    const bin = this.bins[binId];
                    buffer[index[0]++] = binId;
                    bin.write(buffer, index, value);
                },
                (buffer, index) => {
                    const binId = buffer[index[0]++];
                    const bin = this.bins[binId];
                    return bin.read(buffer, index);
                },
                value => 1 + this.getSize(value),
                () => null,
                () => null
            )];
            this.any.of = (...bins) => {
                if (Array.isArray(bins[0])) bins = bins[0];
                if (bins.length > 255) throw new Error("Cannot have more than 255 bins in any.of()");
                const anyOfBin = this.makeBin(
                    `(${bins.map(i => i[nameSymbol]).join(" | ")})`,
                    (buffer, index, value) => {
                        for (let i = 0; i < bins.length; i++) {
                            const bin = bins[i];
                            if (!bin.validate(value)) {
                                buffer[index[0]++] = i;
                                bin.write(buffer, index, value);
                            }
                        }
                    },
                    (buffer, index) => {
                        const binId = buffer[index[0]++];
                        return bins[binId].read(buffer, index);
                    },
                    value => bins.find(i => !i.validate(value)).getSize(value) + 1,
                    value => {
                        if (bins.every(bin => bin.validate(value))) return `Value (${inspect(value)}) doesn't match any of the types ${anyOfBin[nameSymbol]}`;
                    },
                    () => null
                )
                return anyOfBin;
            };
        };
    }

    const lib = new BinJS();
    if (module_) module_.exports = lib;
    if (typeof window !== "undefined") window.BinJS = lib;
})();