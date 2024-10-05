type Bin<V = any, readT = V, writeT = void> = {
    /*** @private */
    __TYPE__: V;
    name: string;
    write(buffer: Buffer, index: [number], value: V): writeT;
    _write(buffer: Buffer, index: [number], value: V): writeT;
    read(buffer: Buffer, index: [number]): readT;
    getSize(value: V): number;
    validate(value: any): string | void;
    assert(value: any);
    serialize(value: any): writeT extends Promise ? Promise<Buffer> : Buffer;
    deserialize(buffer: Buffer): readT;
    makeSample(): V;
    array(length?: number, lengthBytes?: number): NormalArrayBin<V[]>;
};

type Class<T = any, K extends T = any> = new (...args: any[]) => K;
type _classDef<T = any> = [Class<T, T>, (obj: any) => T];

type ArrayBin<T = any[]> = {
    __TYPE__: T;
    name: string;
    write(buffer: Buffer, index: [number], value: T): void;
    _write(buffer: Buffer, index: [number], value: T): void;
    read(buffer: Buffer, index: [number]): T;
    getSize(value: any): number;
    validate(value: any): string | void;
    assert(value: any);
    serialize(value: any): Buffer;
    deserialize(buffer: Buffer): T;
    makeSample(): T;
    array(length?: number, lengthBytes?: number): NormalArrayBin<T[]>;
};

type NormalArrayBin<T = any[]> = ArrayBin<T> & {
    typed<K>(type: AnyBin<K>, length?: number, lengthBytes?: number): NormalArrayBin<K[]>;
    fixed(length: number, lengthBytes?: number): NormalArrayBin<T>;
    struct<K extends Bin[]>(types: K): NormalArrayBin<K[number]["__TYPE__"]>;
};

type SetBin<T = Set<any>> = ArrayBin<T> & {
    typed<K>(type: AnyBin<K>, length?: number, lengthBytes?: number): SetBin<Set<K>>;
    struct<K extends AnyBin<any>[]>(types: K): SetBin<K[number]["__TYPE__"]>;
};

type TypedArrayBin<T> = ArrayBin<T> & {
    fixed(length: number, lengthBytes?: number): TypedArrayBin<T>;
};

type ObjectStructInstance<Obj> = Obj & {
    getSize(): number;
    validate(): string | void;
    assert();
    get buffer(): Buffer;
    set buffer(v: Buffer);
};

type ObjectStruct<Obj> = ObjectBin<Obj>
    // & (() => ObjectStruct<KObj>) // I commented this because when I tabbed after typing myStruc(auto complete),
    // it added () after the autocomplete thinking it's a function. You can still use it like myStruct(), "new" is not forced.
    & (new () => ObjectStructInstance<Obj>);

type ObjectBin<Obj = Record<string, any>> = {
    __TYPE__: Obj;
    name: string;
    write(buffer: Buffer, index: [number], value: Obj, condition?: (key: any, item: any) => boolean): void;
    _write(buffer: Buffer, index: [number], value: Obj, condition?: (key: any, item: any) => boolean): void;
    read(buffer: Buffer, index: [number]): Obj;
    getSize(value: Obj, condition?: (key: any, item: any) => boolean): number;
    validate(value: any, clazz?: Class, condition?: (key: any, item: any) => boolean): string | void;
    assert(value: any, clazz?: Class, condition?: (key: any, item: any) => boolean);
    serialize(value: Obj, condition?: (key: any, item: any) => boolean): Buffer;
    deserialize(buffer: Buffer): Obj;
    makeSample<K>(clazz?: K): (K extends Class ? InstanceType<K> : {}) & Obj;

    typed<K>(type: AnyBin<K>, length?: number, lengthBytes?: number): ObjectBin<Record<string, K>>;
    struct<K extends Record<string, AnyBin<any>>, KObj = { [L in keyof K]: K[L]["__TYPE__"]; }>(struct: K): ObjectStruct<KObj>;
    class<K>(clazz: K, constructor?: (obj: any) => K): ObjectBin<K>;
    /**
     * @description It is highly recommended to use .struct().class() combination instead as it is more consistent.
     *   For example if your class sample has a property with the value 2, it will use u8, but it might be an u32.
     */
    structClass<K>(sample: K, constructor?: (obj: any) => K): ObjectBin<K>;

    array(length?: number, lengthBytes?: number): NormalArrayBin<Obj[]>;
};

type MapBin<Obj = Map<string, any>> = {
    __TYPE__: Obj;
    name: string;
    write(buffer: Buffer, index: [number], value: Obj): void;
    _write(buffer: Buffer, index: [number], value: Obj): void;
    read(buffer: Buffer, index: [number]): Obj;
    getSize(value: Obj): number;
    validate(value: any): string | void;
    assert(value: any);
    serialize(value: Obj): Buffer;
    deserialize(buffer: Buffer): Obj;

    typed<K, V>(keyType: AnyBin<K>, valueType: AnyBin<V>, length?: number, lengthBytes?: number): MapBin<Map<K, V>>;
    makeSample(): MapBin<Obj>;

    array(length?: number, lengthBytes?: number): NormalArrayBin<Obj[]>;
};

type AnyTypeBin<T = any, RV = T, WV = void> = Bin<T, RV, WV> & {
    of<K extends AnyBin<any>[]>(bins: K): AnyTypeBin<K[number]["__TYPE__"]>;
    of<K extends AnyBin<any>[]>(...bins: K[]): AnyTypeBin<K[number]["__TYPE__"]>;
};

type AnyBin<T, RV = any, WV = any> = Bin<T, RV, WV> | NormalArrayBin<T> | SetBin<T> | TypedArrayBin<T> | ObjectBin<T>;

type FlaggedBuffer<T> = Buffer & {
    __type__: T;
};

declare class __ModuleBinJSVar__ {
    bins: AnyBin<any>[];
    constantList: any[];
    classes: _classDef[];

    setOptions(opts?: {
        classes?: (_classDef | Class)[], constantList?: any[]
    }): void;

    valueToBinId(value: any): number;

    getTypeOf<T>(value: T): Bin<T>;

    serialize<T>(value: T): FlaggedBuffer<T>;

    deserialize<T>(buffer: FlaggedBuffer<T>): T;

    getSize(value: any): number;

    makeBin<
        T,
        readT,
        writeT
    >(meta: {
        name: string,
        write: Bin<T, readT, writeT>["write"],
        read: Bin<T, readT>["read"],
        size: Bin<T>["getSize"],
        validate: Bin<T>["validate"],
        sample: Bin<T>["makeSample"]
    }): Bin<T, readT, writeT>;

    registerBin<
        T,
        readT extends T | Promise<T>,
        writeT extends T | Promise<T>
    >(meta: {
        name: string,
        write: Bin<writeT>["write"],
        read: Bin<readT>["read"],
        size: Bin<T>["getSize"],
        validate: Bin<T>["validate"],
        sample: Bin<T>["makeSample"]
    }): number;

    new(opts?: {
        classes?: (_classDef | Class)[], constantList?: any[]
    }): __ModuleBinJSVar__;

    makeLiteral<K extends number | string | boolean | object>(any: K): Bin<K>;

    breakId: number;
    nullId: number;
    undefinedId: number;
    trueId: number;
    falseId: number;
    nanId: number;
    posInfinityId: number;
    negInfinityId: number;
    zeroId: number;
    zeroNId: number;
    u8id: number;
    u16id: number;
    u32id: number;
    u64id: number;
    i8id: number;
    i16id: number;
    i32id: number;
    i64id: number;
    f32id: number;
    f64id: number;
    bigintPosId: number;
    bigintNegId: number;
    bigintId: number;
    string8id: number;
    string16id: number;
    string32id: number;
    stringId: number;
    arrayId: number;
    setId: number;
    u8clampedArrayId: number;
    u8arrayId: number;
    u16arrayId: number;
    u32arrayId: number;
    u64arrayId: number;
    i8arrayId: number;
    i16arrayId: number;
    i32arrayId: number;
    i64arrayId: number;
    f32arrayId: number;
    f64arrayId: number;
    arrayBufferId: number;
    bufferId: number;
    objectId: number;
    mapId: number;
    dateId: number;
    classId: number;
    constantId: number;
    anyId: number;

    null: Bin<null>;
    undefined: Bin<undefined>;
    true: Bin<true>;
    false: Bin<false>;
    nan: Bin<number>;
    posInfinity: Bin<number>;
    negInfinity: Bin<number>;
    zero: Bin<0>;
    zeroN: Bin<0n>;
    u8: Bin<number>;
    u16: Bin<number>;
    u32: Bin<number>;
    u64: Bin<bigint>;
    i8: Bin<number>;
    i16: Bin<number>;
    i32: Bin<number>;
    i64: Bin<bigint>;
    f32: Bin<number>;
    f64: Bin<number>;
    bigintPos: Bin<bigint>;
    bigintNeg: Bin<bigint>;
    bigint: Bin<bigint>;
    string8: Bin<string>;
    string16: Bin<string>;
    string32: Bin<string>;
    string: Bin<string>;
    array: NormalArrayBin;
    set: SetBin;
    u8clampedArray: TypedArrayBin<Uint8ClampedArray>;
    u8array: TypedArrayBin<Uint8Array>;
    u16array: TypedArrayBin<Uint16Array>;
    u32array: TypedArrayBin<Uint32Array>;
    u64array: TypedArrayBin<BigUint64Array>;
    i8array: TypedArrayBin<Int8Array>;
    i16array: TypedArrayBin<Int16Array>;
    i32array: TypedArrayBin<Int32Array>;
    i64array: TypedArrayBin<BigInt64Array>;
    f32array: TypedArrayBin<Float32Array>;
    f64array: TypedArrayBin<Float64Array>;
    arrayBuffer: TypedArrayBin<ArrayBuffer>;
    buffer: TypedArrayBin<Buffer>;
    object: ObjectBin;
    map: MapBin;
    date: Bin<Date>;
    bool: Bin<boolean>;
    boolean: Bin<boolean>;
    class: Bin;
    constant: Bin;
    any: AnyTypeBin;
}

global {
    const BinJS: __ModuleBinJSVar__;
}

export default BinJS;

export type {
    Bin, ArrayBin, NormalArrayBin, TypedArrayBin, ObjectStructInstance, ObjectStruct, ObjectBin, AnyBin,
    MapBin, SetBin, FlaggedBuffer
};