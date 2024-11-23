import {Bin} from "../../Bin";
import {BufferIndex} from "../../BufferIndex";
import Stramp from "../../Stramp";
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
import {DefaultLengthBin} from "../../Utils";
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

    lengthBytes<N extends Bin<number>>(len: N) {
        return new ArrayBinConstructor<ClassType, K, T>(
            this.typesName,
            this.typeName,
            this.fixedName,
            this.fixedTypeName,
            this.baseName,
            this.type,
            this.fixedSize,
            len,
            <any>this.baseClass
        );
    };

    sized<N extends number>(fixedSize: N) {
        return new ArrayBinConstructor<ClassType, K, T>(
            this.typesName,
            this.typeName,
            this.fixedName,
            this.fixedTypeName,
            this.baseName,
            this.type,
            fixedSize,
            this.lengthBin,
            <any>this.baseClass
        );
    };

    typed<N extends any>(type: Bin<N>) {
        return new ArrayBinConstructor<ClassType, N>(
            this.typesName,
            this.typeName,
            this.fixedName,
            this.fixedTypeName,
            this.baseName,
            type,
            this.fixedSize,
            this.lengthBin,
            <any>this.baseClass
        );
    };

    classed<CT extends new (...args: any[]) => Iterable<any>>(clazz: CT) {
        return new ArrayBinConstructor<InstanceType<CT>, K>(
            this.typesName,
            this.typeName,
            this.fixedName,
            this.fixedTypeName,
            this.baseName,
            this.type,
            this.fixedSize,
            this.lengthBin,
            <any>clazz
        );
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
);

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
);

export const ArrayBufferBin = makeTypedArrayBin(<any>function (x: number[]) {
    return new Uint8Array(x).buffer;
}, UInt8Bin);
export const BufferBin = makeTypedArrayBin(<any>function (x: number[]) {
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