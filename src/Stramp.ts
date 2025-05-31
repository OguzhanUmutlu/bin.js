// noinspection JSUnusedGlobalSymbols

import {BufferIndex} from "./BufferIndex";
import BigIntBin from "./number/BigIntBin";
import UBigIntBin from "./number/UBigIntBin";
import Float64Bin from "./number/Float64Bin";
import Float32Bin from "./number/Float32Bin";
import Int64Bin from "./number/Int64Bin";
import Int32Bin from "./number/Int32Bin";
import Int16Bin from "./number/Int16Bin";
import Int8Bin from "./number/Int8Bin";
import UInt64Bin from "./number/UInt64Bin";
import UInt32Bin from "./number/UInt32Bin";
import UInt16Bin from "./number/UInt16Bin";
import UInt8Bin from "./number/UInt8Bin";
import ZeroBin from "./number/specials/ZeroBin";
import BigZeroBin from "./number/specials/BigZeroBin";
import NaNBin from "./number/specials/NaNBin";
import NullBin from "./constant/NullBin";
import UndefinedBin from "./constant/UndefinedBin";
import InfinityBin from "./number/specials/InfinityBin";
import NegativeInfinityBin from "./number/specials/NegativeInfinityBin";
import TrueBin from "./boolean/TrueBin";
import FalseBin from "./boolean/FalseBin";
import BooleanBin from "./boolean/BooleanBin";
import ArrayBin, {
    BufferBin,
    Float32ArrayBin,
    Float64ArrayBin,
    Int16ArrayBin,
    Int32ArrayBin,
    Int64ArrayBin,
    Int8ArrayBin,
    SetBin,
    UInt16ArrayBin,
    UInt32ArrayBin,
    UInt64ArrayBin,
    UInt8ArrayBin,
    UInt8ClampedArrayBin
} from "./array/ArrayBin";
import AnyBin from "./any/AnyBin";
import {Bin, getBinByInternalId} from "./Bin";
import NegBigIntBin from "./number/NegBigIntBin";
import DateBin from "./object/DateBin";
import ObjectBin from "./object/ObjectBin";
import {String16Bin, String32Bin, String8Bin} from "./string/LengthBasedStringBin";
import CStringBin from "./string/CStringBin";
import MapBin from "./object/MapBin";
import ClassInstanceBin from "./object/ClassInstanceBin";
import IgnoreBin from "./misc/IgnoreBin";
import RegExpBin from "./object/RegExpBin";
import IntBaseBin from "./number/base/IntBaseBin";
import BigIntBaseBin from "./number/base/BigIntBaseBin";
import ObjectStructBin from "./object/ObjectStructBin";
import NumberBin from "./number/NumberBin";
import ConstantBin, {ConstantBinConstructor} from "./misc/ConstantBin";

class Stramp extends Bin {
    name = "any";
    sample = null;

    // -- Specials --
    zero = ZeroBin;
    bigZero = BigZeroBin;
    NaN = NaNBin;
    inf = InfinityBin;
    negInf = NegativeInfinityBin;
    null = NullBin;
    undefined = UndefinedBin;
    true = TrueBin;
    false = FalseBin;
    // -- Specials --

    u8 = UInt8Bin;
    u16 = UInt16Bin;
    u32 = UInt32Bin;
    u64 = UInt64Bin;

    i8 = Int8Bin;
    i16 = Int16Bin;
    i32 = Int32Bin;
    i64 = Int64Bin;

    f32 = Float32Bin;
    f64 = Float64Bin;
    number = NumberBin;

    ubigint = UBigIntBin;
    bigint = BigIntBin;

    string8 = String8Bin;
    string16 = String16Bin;
    string32 = String32Bin;
    cstring = CStringBin;

    bool = BooleanBin;
    boolean = BooleanBin;

    array = ArrayBin;
    set = SetBin;
    buffer = BufferBin;
    u8array = UInt8ArrayBin;
    u8clampedArray = UInt8ClampedArrayBin;
    u16array = UInt16ArrayBin;
    u32array = UInt32ArrayBin;
    u64array = UInt64ArrayBin;
    i8array = Int8ArrayBin;
    i16array = Int16ArrayBin;
    i32array = Int32ArrayBin;
    i64array = Int64ArrayBin;
    f32array = Float32ArrayBin;
    f64array = Float64ArrayBin;

    object = ObjectBin;
    map = MapBin;
    class = ClassInstanceBin;

    date = DateBin;
    regexp = RegExpBin;

    any = AnyBin;
    ignore = IgnoreBin;
    constant = new ConstantBinConstructor("Stramp!");

    unsafeWrite(bind: BufferIndex, value: any): void {
        const type = this.getTypeOf(value)!;
        bind.push(type.internalId);
        type.unsafeWrite(bind, value);
    };

    read(bind: BufferIndex) {
        const id = bind.shift()!;
        const type = getBinByInternalId(id)!;
        return type.read(bind);
    };

    unsafeSize(value: any): number {
        const type = this.getTypeOf(value)!;
        return 1 + type.unsafeSize(value);
    };

    findProblem(value: any, _ = false) {
        const type = this.getTypeOf(value);
        if (!type) return this.makeProblem("Unknown type");
    };

    getNumberTypeOf(value: number) {
        if (isNaN(value)) return NaNBin;
        if (value === Infinity) return InfinityBin;
        if (value === -Infinity) return NegativeInfinityBin;
        if (value === 0) return ZeroBin;
        if (value % 1 === 0) {
            if (value >= 0) {
                if (value <= 127) return UInt8Bin;
                if (value <= 32_767) return UInt16Bin;
                if (value <= 2_147_483_647) return UInt32Bin;
            } else {
                if (value >= -128) return Int8Bin;
                if (value >= -32_768) return Int16Bin;
                if (value >= -2_147_483_648) return Int32Bin;
            }
        }

        // NOTE: Float32 is too imprecise, so we are not using it by default, but it can be optionally used.
        /*const FLOAT32_MAX = 3.4028235e38;
        const FLOAT32_MIN = -3.4028235e38;
        const FLOAT32_SMALLEST_POSITIVE = 1.4e-45;

        if ((value >= FLOAT32_SMALLEST_POSITIVE || value === 0) && value <= FLOAT32_MAX && value >= FLOAT32_MIN) {
            return Float32Bin;
        }*/

        return Float64Bin;
    };

    getTypeOf<T>(value: T): Bin<T> | null;

    getTypeOf(value: any): any {
        if (value === true) return TrueBin;
        if (value === false) return FalseBin;
        if (value === null) return NullBin;
        if (value === undefined) return UndefinedBin;
        if (typeof value === "bigint") {
            if (value === 0n) return BigZeroBin;
            if (value > 0n) {
                if (value > UInt64Bin.max) return BigIntBin;
                return UInt64Bin;
            }
            if (value < -Int64Bin.min) return NegBigIntBin;
            return Int64Bin;
        }
        if (typeof value === "number") {
            return this.getNumberTypeOf(value);
        }
        if (typeof value === "string") {
            if (value.length <= UInt8Bin.max) return String8Bin;
            if (value.length <= UInt16Bin.max) return String16Bin;
            if (value.length <= UInt32Bin.max) return String32Bin;

            // This is an impossible case because of JavaScript's string length limit, but it's here for completeness
            return CStringBin;
        }
        if (Array.isArray(value)) return ArrayBin;
        if (value instanceof Date) return DateBin;
        if (value instanceof Map) return MapBin;
        if (value instanceof Set) return SetBin;
        if (value instanceof Uint8Array) return UInt8ArrayBin;
        if (value instanceof Uint8ClampedArray) return UInt8ClampedArrayBin;
        if (value instanceof Uint16Array) return UInt16ArrayBin;
        if (value instanceof Uint32Array) return UInt32ArrayBin;
        if (value instanceof BigUint64Array) return UInt64ArrayBin;
        if (value instanceof Int8Array) return Int8ArrayBin;
        if (value instanceof Int16Array) return Int16ArrayBin;
        if (value instanceof Int32Array) return Int32ArrayBin;
        if (value instanceof BigInt64Array) return Int64ArrayBin;
        if (value instanceof Float32Array) return Float32ArrayBin;
        if (value instanceof Float64Array) return Float64ArrayBin;
        if (value instanceof RegExp) return RegExpBin;
        if (typeof value === "object") return value.constructor === Object ? ObjectBin : ClassInstanceBin;

        return null;
    };

    getStrictTypeOf<T>(value: T): Bin<T> | null;

    getStrictTypeOf(value: any) {
        const base = this.getTypeOf(value);
        if ("struct" in base && typeof base.struct === "function") {
            return base.struct(value);
        }

        return base;
    };
}

const stramp = new Stramp;

export default stramp;

Bin.AnyBin = AnyBin;

export {
    UInt8Bin as u8,
    UInt16Bin as u16,
    UInt32Bin as u32,
    UInt64Bin as u64,
    Int8Bin as i8,
    Int16Bin as i16,
    Int32Bin as i32,
    Int64Bin as i64,
    Float32Bin as f32,
    Float64Bin as f64,
    UBigIntBin as ubigint,
    BigIntBin as bigint,
    String8Bin as s8,
    String16Bin as s16,
    String32Bin as s32,
    ZeroBin as zero,
    BigZeroBin as bigZero,
    NaNBin as NaN,
    NullBin as null_,
    UndefinedBin as undefined,
    InfinityBin as inf,
    NegativeInfinityBin as negInf,
    TrueBin as true_,
    FalseBin as false_,
    BooleanBin as bool,
    CStringBin as string,
    ArrayBin as array,
    ConstantBin as constant,
    stramp as any,

    Bin,
    BufferIndex,
    IntBaseBin,
    BigIntBaseBin,
    ObjectStructBin
}