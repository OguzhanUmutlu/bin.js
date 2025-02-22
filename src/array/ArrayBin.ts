import {Bin} from "../Bin";
import {BufferIndex} from "../BufferIndex";
import Stramp from "../Stramp";
import UInt8Bin from "../number/UInt8Bin";
import UInt16Bin from "../number/UInt16Bin";
import UInt64Bin from "../number/UInt64Bin";
import UInt32Bin from "../number/UInt32Bin";
import Int8Bin from "../number/Int8Bin";
import Int16Bin from "../number/Int16Bin";
import Int32Bin from "../number/Int32Bin";
import Int64Bin from "../number/Int64Bin";
import Float32Bin from "../number/Float32Bin";
import Float64Bin from "../number/Float64Bin";
import {Buffer} from "buffer";
import {DefaultLengthBin} from "../Utils";
import {ArrayStructBinConstructor} from "./ArrayStructBin";

// type SizedArray<T, N extends number, R extends T[] = []> = R["length"] extends N ? R : SizedArray<T, N, [...R, T]>;

// all array type combinations:
// - any[]       type=null   types=null        fixedSize=null
// - X[]         type=X      types=null        fixedSize=null
// - [X, Y, Z]   type=null   types=[X, Y, Z]   fixedSize=null
// - any[S]      type=null   types=null        fixedSize=S
// - X[S]        type=X      types=null        fixedSize=S

export class ArrayBinConstructor<
    ClassType extends "array" | "set" | Iterable<any>,
    K extends any = any,
    T extends Iterable<K> = ClassType extends "array" ? K[] : (ClassType extends "set" ? Set<K> : ClassType)
> extends Bin<T> {
    name: string;
    lengthBinSize: number;

    constructor(
        public typesName: (types: Bin[]) => string,
        public typeName: (type: Bin) => string,
        public fixedName: (fixed: number) => string,
        public fixedTypeName: (fixed: number, type: Bin) => string,
        public baseName: string,
        public type: Bin<K> | null = null,
        public fixedSize: number | null = null,
        public lengthBin: Bin<number> = DefaultLengthBin,
        public baseClass: new (...args: any[]) => T
    ) {
        super();
    }

    init() {
        this.lengthBinSize = this.lengthBin.unsafeSize(1);

        if (this.fixedSize) {
            if (this.type) {
                this.name = this.fixedTypeName(this.fixedSize, this.type);
            } else {
                this.name = this.fixedName(this.fixedSize);
            }
        } else if (this.type) {
            this.name = this.typeName(this.type);
        } else {
            this.name = this.baseName;
        }

        return this;
    };

    unsafeWrite(bind: BufferIndex, value: T): void {
        if (!this.fixedSize) {
            let length: number = "size" in value ? value.size : (<any>value).length;
            this.lengthBin.unsafeWrite(bind, length);
        }

        const type = this.type || Stramp;
        const arr = Array.from(value);
        for (let i = 0; i < arr.length; i++) {
            type.unsafeWrite(bind, arr[i]);
        }
    };

    read(bind: BufferIndex): T {
        const length = this.fixedSize ?? this.lengthBin.read(bind);
        const result = new Array(length);

        const type = this.type || Stramp;
        for (let i = 0; i < length; i++) {
            result[i] = type.read(bind);
        }

        return <any>this.baseClass === Array ? <any>result : new this.baseClass(result);
    };

    unsafeSize(value: T): number {
        let size = this.fixedSize ? 0 : this.lengthBinSize;
        const type = this.type || Stramp;
        const arr = Array.from(value);
        const length = arr.length;

        for (let i = 0; i < length; i++) {
            size += type.unsafeSize(arr[i]);
        }

        return size;
    };

    findProblem(value: any, strict = false) {
        if (value === null || typeof value !== "object" || !(Symbol.iterator in value)) return this.makeProblem("Expected an iterable");

        if (strict && value.constructor !== this.baseClass) return this.makeProblem(`Expected an iterable of ${this.baseName}`);

        const type = this.type || Stramp;
        const arr = Array.from(value);

        for (let i = 0; i < arr.length; i++) {
            const problem = type.findProblem(arr[i], strict);
            if (problem) return problem.shifted(`[${i}]`, this);
        }
    };

    get sample(): T {
        if (!this.fixedSize) return new this.baseClass();

        const type = this.type || Stramp;
        const result = new Array(this.fixedSize);

        for (let i = 0; i < this.fixedSize; i++) {
            result[i] = type.sample;
        }

        return new this.baseClass(result);
    };

    adapt(value: any): T {
        if (typeof value !== "object" || value === null || !(Symbol.iterator in value)) value = [];

        value = Array.from(value);

        if (this.fixedSize) {
            if (value.length > this.fixedSize) value.length = this.fixedSize;
            else {
                const len = value.length;

                for (let i = len; i < this.fixedSize; i++) {
                    value.push(this.type ? this.type.sample : null);
                }
            }
        }

        const maxLength = 1 << this.lengthBinSize;

        if (value.length >= maxLength) {
            value.length = maxLength - 1;
        }

        if (this.type) for (let i = 0; i < value.length; i++) {
            value[i] = this.type.adapt(value[i]);
        }

        return super.adapt(<any>this.baseClass === Array ? value : new this.baseClass(value));
    };

    lengthBytes<N extends Bin<number>>(len: N) {
        const o = this.copy(false);
        o.lengthBin = len;
        o.init();
        return o;
    };

    sized<N extends number>(fixedSize: N) {
        const o = this.copy(false);
        o.fixedSize = fixedSize;
        o.init();
        return o;
    };

    typed<N extends any>(type: Bin<N>) {
        const o = <ArrayBinConstructor<ClassType, N>><any>this.copy(false);
        o.type = type;
        o.init();
        return o;
    };

    classed<CT extends new (...args: any[]) => Iterable<any>>(clazz: CT) {
        const o = <ArrayBinConstructor<InstanceType<CT>, K>><any>this.copy(false);
        o.baseClass = <any>clazz;
        o.init();
        return o;
    };

    struct<N extends any[]>(types: Bin<N[number]>[]) {
        return new ArrayStructBinConstructor<ClassType, N[number]>(
            this.typesName,
            this.typeName,
            this.fixedName,
            this.fixedTypeName,
            this.baseName,
            types,
            <any>this.baseClass
        );
    };

    copy(init = true) {
        const o = super.copy();
        o.typesName = this.typesName;
        o.typeName = this.typeName;
        o.fixedName = this.fixedName;
        o.fixedTypeName = this.fixedTypeName;
        o.baseName = this.baseName;
        o.type = this.type;
        o.fixedSize = this.fixedSize;
        o.lengthBin = this.lengthBin.copy();
        o.baseClass = this.baseClass;
        if (init) o.init();
        return <this>o;
    };
}

export default new ArrayBinConstructor<"array">(
    (types: Bin[]) => `[ ${types.map(t => t.name).join(", ")} ]`,
    (type: Bin) => `${type.name}[]`,
    (fixed: number) => `any[${fixed}]`,
    (fixed: number, type: Bin) => `${type.name}[${fixed}]`,
    "Array",
    null,
    null,
    DefaultLengthBin,
    Array
).copy();

export function makeTypedArrayBin<ArrayType extends Iterable<any>, T extends Bin>(clazz: new (...args: any[]) => ArrayType, type: T) {
    return new ArrayBinConstructor<ArrayType>(
        () => {
            throw new Error(`${clazz.name} only supports ${type.name}`);
        },
        (type_: Bin) => {
            if (type_ !== type) throw new Error(`${clazz.name} only supports ${type.name}`);
            return clazz.name;
        },
        (fixed: number) => `${clazz.name}<length=${fixed}>`,
        (fixed: number, type_: Bin) => {
            if (type_ !== type) throw new Error(`${clazz.name} only supports ${type.name}`);
            return `${clazz.name}<length=${fixed}>`;
        },
        clazz.name,
        type,
        null,
        DefaultLengthBin,
        <any>clazz
    );
}

export const SetBin = new ArrayBinConstructor<"set">(
    (types: Bin[]) => `Set<${types.map(t => t.name).join(", ")}>`,
    (type: Bin) => `Set<type=${type.name}>`,
    (fixed: number) => `Set<length=${fixed}>`,
    (fixed: number, type: Bin) => `Set<type=${type.name}, length=${fixed}>`,
    "Set",
    null,
    null,
    DefaultLengthBin,
    Set
).copy();

export const BufferBin: ArrayBinConstructor<Buffer> = makeTypedArrayBin(<any>function (x: number[]) {
    return Buffer.from(x);
}, UInt8Bin);
export const UInt8ArrayBin = makeTypedArrayBin(Uint8Array, UInt8Bin);
export const UInt8ClampedArrayBin = makeTypedArrayBin(Uint8ClampedArray, UInt8Bin);
export const UInt16ArrayBin = makeTypedArrayBin(Uint16Array, UInt16Bin);
export const UInt32ArrayBin = makeTypedArrayBin(Uint32Array, UInt32Bin);
export const UInt64ArrayBin = makeTypedArrayBin(BigUint64Array, UInt64Bin);
export const Int8ArrayBin = makeTypedArrayBin(Int8Array, Int8Bin);
export const Int16ArrayBin = makeTypedArrayBin(Int16Array, Int16Bin);
export const Int32ArrayBin = makeTypedArrayBin(Int32Array, Int32Bin);
export const Int64ArrayBin = makeTypedArrayBin(BigInt64Array, Int64Bin);
export const Float32ArrayBin = makeTypedArrayBin(Float32Array, Float32Bin);
export const Float64ArrayBin = makeTypedArrayBin(Float64Array, Float64Bin);