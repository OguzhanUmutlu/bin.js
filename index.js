(function () {
    const get = t => eval(`typeof ${t} !== "undefined" ? ${t} : null`);
    const global_ = get("self") || get("global") || this;
    const module_ = get("module");

    const Buffer = global_.Buffer || require("buffer").Buffer;

    function baseAssert(val, bool) {
        if (!bool) return `Invalid value(${JSON.stringify(val)})`;
    }

    const writeFnMatch = {1: "writeUint8", 2: "writeUint16LE", 4: "writeUint32LE", 8: "writeBigUint64LE"};
    const readFnMatch = {1: "readUint8", 2: "readUint16LE", 4: "readUint32LE", 8: "readBigUint64LE"};

    class BinJS {
        _id = 1;

        constructor({classes = [], anyList = []} = {}) {
            this.bins = [];
            this.anyList = [];
            this.classes = [];
            this.__registerBuiltInBins();
            this.setOptions({classes, anyList});
        };

        setOptions({classes = [], anyList = []} = {}) {
            this.classes.length = 0;
            this.anyList.length = 0;
            classes.forEach(i => {
                const ar = Array.isArray(i);
                const clazz = ar ? i[0] : i;
                this.classes.push([clazz, (ar && i[1]) || (obj => {
                    const instance = new clazz();
                    for (const k in obj) if (k !== "constructor") instance[k] = obj[k];
                    return instance;
                })]);
            });
            this.anyList.push(...anyList);
            return this;
        };

        new({classes = [], anyList = []} = {}) {
            return new BinJS({classes, anyList});
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

            return this.anyId;
        };

        valueToBin(value) {
            return this.bins[this.valueToBinId(value)];
        };

        serialize(value) {
            const id = this.valueToBinId(value);
            const buffer = Buffer.allocUnsafe(this.bins[id].size(value) + 1);
            buffer[0] = id;
            this.bins[id].write(buffer, [1], value);
            return buffer;
        };

        deserialize(buffer) {
            return this.bins[buffer[0]].read(buffer, [1]);
        };

        size(value) {
            return this.valueToBin(value).size(value);
        };

        __makeBin(name, write, read, size, validate) {
            return {
                name, write: (buffer, index, value, ...args) => {
                    const err = validate(value, ...args);
                    if (err) throw new Error(name + err);
                    write(buffer, index, value, ...args);
                    return buffer;
                }, _write: write, read, size, validate, serialize(value, ...args) {
                    const buffer = Buffer.allocUnsafe(this.size(value));
                    this.write(buffer, [0], value, ...args);
                    return buffer;
                },
                deserialize(buffer, ...args) {
                    return this.read(buffer, [0], ...args);
                }
            }
        };

        __registerBin(name, write, read, size, validate, errorPrefix = "") {
            const id = this._id++;
            if (id > 255) throw new Error("Too many bins");
            this.bins[id] = this.__makeBin(name, write, read, size, validate, errorPrefix);
            return id;
        };

        __registerBuiltInBins() {
            this.breakId = this._id++;
            this.null = this.bins[this.nullId = this.__registerBin(
                "null",
                () => null,
                () => null,
                () => 0,
                () => null
            )];
            this.undefined = this.bins[this.undefinedId = this.__registerBin(
                "undefined",
                () => undefined,
                () => undefined,
                () => 0,
                () => null
            )];
            this.true = this.bins[this.trueId = this.__registerBin(
                "true",
                () => true,
                () => true,
                () => 0,
                () => null
            )];
            this.false = this.bins[this.falseId = this.__registerBin(
                "false",
                () => false,
                () => false,
                () => 0,
                () => null
            )];
            this.nan = this.bins[this.nanId = this.__registerBin(
                "NaN",
                () => NaN,
                () => NaN,
                () => 0,
                () => null
            )];
            this.posInfinity = this.bins[this.posInfinityId = this.__registerBin(
                "+Infinity",
                () => Infinity,
                () => Infinity,
                () => 0,
                () => null
            )];
            this.negInfinity = this.bins[this.negInfinityId = this.__registerBin(
                "-Infinity",
                () => -Infinity,
                () => -Infinity,
                () => 0,
                () => null
            )];
            this.zero = this.bins[this.zeroId = this.__registerBin(
                "0",
                () => 0,
                () => 0,
                () => 0,
                () => null
            )];
            this.zeroN = this.bins[this.zeroNId = this.__registerBin(
                "0n",
                () => 0n,
                () => 0n,
                () => 0,
                () => null
            )];

            this.u8 = this.bins[this.u8id = this.__registerBin(
                "u8",
                (buffer, index, value) => buffer[index[0]++] = value,
                (buffer, index) => buffer[index[0]++],
                () => 1,
                v => baseAssert(v, typeof v === "number" && !isNaN(v) && v >= 0 && v <= 255)
            )];
            this.u16 = this.bins[this.u16id = this.__registerBin(
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
                v => baseAssert(v, typeof v === "number" && !isNaN(v) && v >= 0 && v <= 65535)
            )];
            this.u32 = this.bins[this.u32id = this.__registerBin(
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
                v => baseAssert(v, typeof v === "number" && !isNaN(v) && v >= 0 && v <= 4294967295)
            )];
            this.u64 = this.bins[this.u64id = this.__registerBin(
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
                v => baseAssert(v, typeof v === "bigint" && v >= 0n && v <= 18446744073709551615n)
            )];
            this.i8 = this.bins[this.i8id = this.__registerBin(
                "i8",
                (buffer, index, value) => buffer[index[0]++] = value + 128,
                (buffer, index) => buffer[index[0]++] - 128,
                () => 1,
                v => baseAssert(v, typeof v === "number" && !isNaN(v) && v >= -128 && v <= 127)
            )];
            this.i16 = this.bins[this.i16id = this.__registerBin(
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
                v => baseAssert(v, typeof v === "number" && !isNaN(v) && v >= -32768 && v <= 32767)
            )];
            this.i32 = this.bins[this.i32id = this.__registerBin(
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
                v => baseAssert(v, typeof v === "number" && !isNaN(v) && v >= -2147483648 && v <= 2147483647)
            )];
            this.i64 = this.bins[this.i64id = this.__registerBin(
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
                v => baseAssert(v, typeof v === "bigint" && v >= -9223372036854775808n && v <= 9223372036854775807n)
            )];
            this.f32 = this.bins[this.f32id = this.__registerBin(
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
                v => baseAssert(v, typeof v === "number" && !isNaN(v) && v >= -3.4028234663852886e+38 && v <= 3.4028234663852886e+38)
            )];
            this.f64 = this.bins[this.f64id = this.__registerBin(
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
                v => baseAssert(v, typeof v === "number" && !isNaN(v) && v >= -1.7976931348623157e+308 && v <= 1.7976931348623157e+308)
            )];
            this.bigintPos = this.bins[this.bigintPosId = this.__registerBin(
                "bigintPos",
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
                v => baseAssert(v, typeof v === "bigint" && v > 0n)
            )];
            this.bigintNeg = this.bins[this.bigintNegId = this.__registerBin(
                "bigintNeg",
                (buffer, index, value) => this.bigintPos.write(buffer, index, -value),
                (buffer, index) => -this.bigintPos.read(buffer, index, 0),
                value => this.bigintPos.size(-value),
                v => baseAssert(v, typeof v === "bigint" && v < 0n)
            )];

            this.string8 = this.bins[this.string8id = this.__registerBin(
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
                v => baseAssert(v, typeof v === "string" && Buffer.byteLength(v, "utf8") <= 255)
            )];
            this.string16 = this.bins[this.string16id = this.__registerBin(
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
                v => baseAssert(v, typeof v === "string" && Buffer.byteLength(v, "utf8") <= 65535)
            )];
            this.string32 = this.bins[this.string32id = this.__registerBin(
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
                v => baseAssert(v, typeof v === "string" && Buffer.byteLength(v, "utf8") <= 4294967295)
            )];
            this.string = this.bins[this.stringId = this.__registerBin(
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
                v => baseAssert(v, typeof v === "string")
            )]

            this.array = this.bins[this.arrayId = this.__registerBin(
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
                    return 1 + value.reduce((sum, item) => sum + this.valueToBin(item).size(item) + 1, 0);
                },
                v => {
                    if (!Array.isArray(v)) return "Expected an array";
                }
            )];

            const addArrayProps = (array, clazz = Array, convert = r => r) => {
                array.typed = (type, lengthBytes = 2) => {
                    const readFn = readFnMatch[lengthBytes];
                    const writeFn = writeFnMatch[lengthBytes];
                    return this.__makeBin(
                        `array<${type.name}>`,
                        (buffer, index, value) => {
                            // I used length because if I don"t, this causes a bug: [1, 2, 3], resulting in a buffer that starts with the array break byte.
                            let length = value.length;
                            if (lengthBytes === 8) length = BigInt(length);
                            buffer[writeFn](length, index[0]);
                            index[0] += lengthBytes;
                            for (let i = 0; i < value.length; i++) {
                                const item = value[i];
                                type._write(buffer, index, item);
                            }
                        },
                        (buffer, index) => {
                            const length = Number(buffer[readFn](index[0]));
                            index[0] += lengthBytes;
                            const value = [];
                            for (let i = 0; i < length; i++) {
                                value[i] = type.read(buffer, index);
                            }
                            return convert(value);
                        },
                        value => lengthBytes + value.reduce((sum, item) => sum + type.size(item), 0),
                        v => {
                            if (!(v instanceof clazz)) return `Expected an instance of ${clazz.name}`;
                            for (let i = 0; i < v.length; i++) {
                                const item = v[i];
                                const err = type.validate(item);
                                if (err) return `[${i}]${err[0] === "[" ? "" : ": "}${err}`;
                            }
                        }
                    );
                };
                array.struct = types => {
                    return this.__makeBin(
                        `[${types.map(t => t.name).join(", ")}]`,
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
                        value => value.reduce((sum, item, i) => sum + types[i].size(item), 0),
                        v => {
                            if (!(v instanceof clazz)) return `Expected an instance of ${clazz.name}`;
                            if (v.length !== types.length) return `Expected ${types.length} items, but got ${v.length}`;
                            for (let i = 0; i < v.length; i++) {
                                const item = v[i];
                                const err = types[i].validate(item);
                                if (err) return `[${i}]${err[0] === "[" ? "" : ": "}${err}`;
                            }
                        }
                    );
                };
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

            for (const [name1, name2, clazz] of [
                ["set", "setId", Set],
                ["u8clampedArray", "u8clampedArrayId", Uint8ClampedArray],
                ["u8array", "u8arrayId", Uint8Array],
                ["u16array", "u16arrayId", Uint16Array],
                ["u32array", "u32arrayId", Uint32Array],
                ["u64array", "u64arrayId", BigUint64Array],
                ["i8array", "i8arrayId", Int8Array],
                ["i16array", "i16arrayId", Int16Array],
                ["i32array", "i32arrayId", Int32Array],
                ["i64array", "i64arrayId", BigInt64Array],
                ["f32array", "f32arrayId", Float32Array],
                ["f64array", "f64arrayId", Float64Array],
                ["arrayBuffer", "arrayBufferId", ArrayBuffer]
            ]) {
                addArrayProps(this[name1] = this.bins[this[name2] = this.__registerBin(
                    clazz.name,
                    (buffer, index, value) => {
                        this.array._write(buffer, index, [...value]);
                    },
                    (buffer, index) => {
                        return new clazz(this.array.read(buffer, index));
                    },
                    value => this.array.size([...value]),
                    value => this.array.validate([...value])
                )], clazz, v => new clazz(v));
            }

            this.object = this.bins[this.objectId = this.__registerBin(
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
                        sum + (condition(item) && this.string.size(key) + this.size(item) + 1), 0);
                },
                (v, clazz = Object) => {
                    if (v === null || typeof v !== "object" || v.constructor !== clazz) return clazz === Object ? "Expected a raw object" : `Expected an instance of ${clazz.name}`;
                }
            )];
            const classCheck = item => typeof item !== "function" || this.anyList.includes(item);
            const addClassProp = base => {
                base.class = (clazz, constructor = obj => {
                    const instance = new clazz();
                    for (const k in obj) if (k !== "constructor") instance[k] = obj[k];
                    return instance;
                }) => {
                    return this.__makeBin(
                        clazz.name,
                        (buffer, index, value) => base._write(buffer, index, value, classCheck),
                        (buffer, index) => constructor(base.read(buffer, index)),
                        value => base.size(value, classCheck),
                        v => base.validate(v, clazz, classCheck)
                    );
                };
                return base;
            };
            addClassProp(this.object);
            this.object.typed = (type, lengthBytes = 2) => {
                const readFn = readFnMatch[lengthBytes];
                const writeFn = writeFnMatch[lengthBytes];
                return addClassProp(this.__makeBin(
                    `object<string, ${type.name}>`,
                    (buffer, index, value, condition = () => true) => {
                        const entries = Object.entries(value).filter(i => condition(i[1]));
                        let length = entries.length;
                        if (lengthBytes === 8) length = BigInt(length);

                        // I used length because if I don"t, this causes a bug: {"\x01": "hi"}, resulting in a buffer that starts with the object break byte.
                        buffer[writeFn](length, index[0]);
                        index[0] += lengthBytes;
                        for (const [key, item] of entries) {
                            this.string._write(buffer, index, key);
                            type._write(buffer, index, item);
                        }
                    },
                    (buffer, index) => {
                        const length = Number(buffer[readFn](index[0]));
                        index[0] += lengthBytes;
                        const value = {};
                        for (let i = 0; i < length; i++) {
                            value[this.string.read(buffer, index)] = type.read(buffer, index);
                        }
                        return value;
                    },
                    (value, condition = () => true) => {
                        return lengthBytes + Object.entries(value).reduce((sum, [key, item]) =>
                            sum + (condition(item) && this.string.size(key) + type.size(item)), 0);
                    },
                    (v, clazz = Object, condition = () => true) => {
                        if (v === null || typeof v !== "object" || v.constructor !== clazz) return "Expected a raw object";
                        for (const [key, item] of Object.entries(v)) {
                            if (!condition(item)) continue;
                            const err = type.validate(item);
                            if (err) return `[${JSON.stringify(key)}]${err[0] === "[" ? "" : ": "}${err}`;
                        }
                    }
                ));
            };
            this.object.struct = obj => {
                if (typeof obj !== "object") throw new Error("Expected an object for the struct definition");
                if (obj.constructor !== Object) throw new Error("Expected an object for the struct definition");
                const struct = Object.entries(obj).sort((a, b) => a[0].localeCompare(b[0]));
                return addClassProp(this.__makeBin(
                    `{${struct.map(([key, type]) => `${JSON.stringify(key)}: ${type.name}`).join(", ")}}`,
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
                    value => struct.reduce((sum, [key, type]) => sum + type.size(value[key]), 0),
                    (v, clazz = Object) => {
                        if (v === null || typeof v !== "object" || v.constructor !== clazz) return clazz === Object ? "Expected a raw object" : `Expected an instance of ${clazz.name}`;

                        for (const [key, type] of struct) {
                            const err = type.validate(v[key]);
                            if (err) return `[${JSON.stringify(key)}]${err[0] === "[" ? "" : ": "}${err}`;
                        }
                    }
                ));
            };

            this.map = this.bins[this.mapId = this.__registerBin(
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
                    return 1 + [...value].reduce((sum, [key, item]) => sum + this.size(key) + this.size(item) + 2, 0);
                },
                v => {
                    if (v === null || typeof v !== "object" || !(v instanceof Map)) return "Expected an instance of Map";
                }
            )];
            this.map.typed = (keyType, valueType, lengthBytes = 2) => {
                const readFn = readFnMatch[lengthBytes];
                const writeFn = writeFnMatch[lengthBytes];
                return addClassProp(this.__makeBin(
                    `map<${keyType.name}, ${valueType.name}>`,
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
                    value => lengthBytes + [...value].reduce((sum, [key, item]) => sum + keyType.size(key) + valueType.size(item), 0),
                    v => {
                        if (v === null || typeof v !== "object" || !(v instanceof Map)) return "Expected an instance of Map";

                        for (const [key, item] of v) {
                            let err = keyType.validate(key);
                            if (err) return `[${JSON.stringify(key)}][key]${err[0] === "[" ? "" : ": "}${err}`;

                            err = valueType.validate(item);
                            if (err) return `[${JSON.stringify(key)}][value]${err[0] === "[" ? "" : ": "}${err}`;
                        }
                    }
                ));
            };

            this.date = this.bins[this.dateId = this.__registerBin(
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
                }
            )];


            this.class = this.bins[this.classId = this.__registerBin(
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
                value => this.object.size(value, classCheck) + 2,
                v => {
                    if (v === null || typeof v !== "object") return "Expected an instance of a class";
                    if (!this.classes.some(i => i[0] === v.constructor)) return `Unknown class: ${v.constructor.name}`;
                }
            )];

            this.any = this.bins[this.anyId = this.__registerBin(
                "any",
                (buffer, index, value) => {
                    const anyId = this.anyList.indexOf(value);
                    buffer.writeUint16LE(anyId, index[0]);
                    index[0] += 2;
                },
                (buffer, index) => {
                    const anyId = buffer.readUint16LE(index[0]);
                    index[0] += 2;
                    return this.anyList[anyId];
                },
                () => 2,
                v => {
                    if (!this.anyList.includes(v)) return `Unknown any: ${v.name}`;
                }
            )];
        };
    }

    const lib = new BinJS();
    if (module_) module_.exports = lib;
    if (typeof window !== "undefined") window.BinJS = lib;
})();