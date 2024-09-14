type Bin<V = any> = {
    /*** @private */
    __TYPE__: V;
    name: string;
    write(buffer: Buffer, index: [number], value: V): void;
    _write(buffer: Buffer, index: [number], value: V): void;
    read(buffer: Buffer, index: [number]): V;
    size(value: V): number;
    validate(value: any): string | void;
    serialize(value: any): Buffer;
    deserialize(buffer: Buffer): any;
    makeSample(): V;
};

type Class<T = any, K extends T = any> = new (...args: any[]) => K;
type _classDef<T = any> = [Class<T, T>, (obj: any) => T];

type ArrayBin<T = any[]> = {
    __TYPE__: T;
    name: string;
    write(buffer: Buffer, index: [number], value: T): void;
    _write(buffer: Buffer, index: [number], value: T): void;
    read(buffer: Buffer, index: [number]): T;
    size(value: any): number;
    validate(value: any): string | void;
    serialize(value: any): Buffer;
    deserialize(buffer: Buffer): T;
    makeSample(): T;
};

type NormalArrayBin<T = any[]> = ArrayBin<T> & {
    typed<K>(type: AnyBin<K>, length?: number, lengthBytes?: number): NormalArrayBin<K[]>;
    struct<K extends Bin[]>(types: K): NormalArrayBin<K[number]["__TYPE__"]>;
};

type SetBin<T = Set<any>> = ArrayBin<T> & {
    typed<K>(type: AnyBin<K>, length?: number, lengthBytes?: number): SetBin<Set<K>>;
    struct<K extends AnyBin<any>[]>(types: K): SetBin<K[number]["__TYPE__"]>;
};

type TypedArrayBin<T> = ArrayBin<T> & {
    fixed(length: number, lengthBytes?: number): TypedArrayBin<T>;
};

type ObjectStruct<Obj> = Obj & {
    getSize(): number;
    validate(): string | void;
    get buffer(): Buffer;
    set buffer(v: Buffer);
};

type ObjectBin<Obj = Record<string, any>> = {
    __TYPE__: Obj;
    name: string;
    write(buffer: Buffer, index: [number], value: Obj, condition?: (key: any, item: any) => boolean): void;
    _write(buffer: Buffer, index: [number], value: Obj, condition?: (key: any, item: any) => boolean): void;
    read(buffer: Buffer, index: [number]): Obj;
    size(value: Obj, condition?: (key: any, item: any) => boolean): number;
    validate(value: Obj, clazz?: Class, condition?: (key: any, item: any) => boolean): string | void;
    serialize(value: Obj, condition?: (key: any, item: any) => boolean): Buffer;
    deserialize(buffer: Buffer): Obj;
    makeSample<K>(clazz?: K): (K extends Class ? InstanceType<K> : {}) & Obj;

    typed<K>(type: AnyBin<K>, length?: number, lengthBytes?: number): ObjectBin<Record<string, K>>;
    struct<K extends Record<string, AnyBin<any>>, KObj = { [L in keyof K]: K[L]["__TYPE__"]; }>(struct: K):
        ObjectBin<KObj>
        // & (() => ObjectStruct<KObj>) // I commented this because when I tabbed after typing myStruc(auto complete),
        // it added () after the autocomplete thinking it's a function. You can still use it like myStruct(), "new" is not forced.
        & (new () => ObjectStruct<KObj>);
    class<K>(clazz: K, constructor?: (obj: any) => K): ObjectBin<K>;
    /**
     * @description It is highly recommended to use .struct().class() combination instead as it is more consistent.
     *   For example if your class sample has a property with the value 2, it will use u8, but it might be an u32.
     */
    structClass<K>(sample: K, constructor?: (obj: any) => K): ObjectBin<K>;
};

type MapBin<Obj = Map<string, any>> = {
    __TYPE__: Obj;
    name: string;
    write(buffer: Buffer, index: [number], value: Obj): void;
    _write(buffer: Buffer, index: [number], value: Obj): void;
    read(buffer: Buffer, index: [number]): Obj;
    size(value: Obj): number;
    validate(value: Obj): string | void;
    serialize(value: Obj): Buffer;
    deserialize(buffer: Buffer): Obj;

    typed<K, V>(keyType: AnyBin<K>, valueType: AnyBin<V>, length?: number, lengthBytes?: number): MapBin<Map<K, V>>;
    makeSample(): MapBin<Obj>;
};

type AnyBin<T> = Bin<T> | NormalArrayBin<T> | SetBin<T> | TypedArrayBin<T> | ObjectBin<T>;

type FlaggedBuffer<T> = Buffer & {
    __type__: T;
};

declare class __ModuleBinJSVar__ {
    bins: AnyBin<any>[];
    anyList: any[];
    classes: _classDef[];

    setOptions(opts?: {
        classes?: (_classDef | Class)[], anyList?: any[]
    }): void;

    valueToBinId(value: any): number;

    getTypeOf<T>(value: T): Bin<T>;

    serialize<T>(value: T): FlaggedBuffer<T>;

    deserialize<T>(buffer: FlaggedBuffer<T>): T;

    size(value: any): number;

    __makeBin<T>(write: Bin<T>["write"], read: Bin<T>["read"], size: Bin<T>["size"], validate: Bin<T>["validate"]): Bin<T>;

    __registerBin<T>(write: Bin<T>["write"], read: Bin<T>["read"], size: Bin<T>["size"], validate: Bin<T>["validate"]): number;

    new(opts?: {
        classes?: (_classDef | Class)[], anyList?: any[]
    }): __ModuleBinJSVar__;

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
    objectId: number;
    mapId: number;
    dateId: number;
    classId: number;
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
    object: ObjectBin;
    map: MapBin;
    date: Bin<Date>;
    class: Bin;
    any: Bin;
}

declare global {
    const BinJS: __ModuleBinJSVar__;
}

export = BinJS;