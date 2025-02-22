import {Bin} from "../Bin";
import {BufferIndex} from "../BufferIndex";
import Stramp from "../Stramp";
import {DefaultLengthBin} from "../Utils";

class MapBinConstructor<
    KType extends Bin,
    VType extends Bin,
    T extends Map<KType["__TYPE__"], VType["__TYPE__"]> = Map<KType["__TYPE__"], VType["__TYPE__"]>
> extends Bin<T> {
    name: string;
    lengthBinSize: number;

    constructor(
        public keyType: KType | null,
        public valueType: VType | null,
        public lengthBin: Bin<number>
    ) {
        super();
    };

    init() {
        this.name = `Map<${this.keyType ? this.keyType.name : "any"}, ${this.valueType ? this.valueType.name : "any"}>`;
        this.lengthBinSize = this.lengthBin.unsafeSize(1);

        return this;
    };

    unsafeWrite(bind: BufferIndex, map: T) {
        const length = map.size;
        this.lengthBin.unsafeWrite(bind, length);
        const keyType = this.keyType ?? Stramp;
        const valueType = this.valueType ?? Stramp;

        for (const [key, value] of map) {
            keyType.unsafeWrite(bind, key);
            valueType.unsafeWrite(bind, value);
        }
    };

    read(bind: BufferIndex): T {
        const length = this.lengthBin.read(bind);
        const result = <T>new Map;
        const keyType = this.keyType ?? Stramp;
        const valueType = this.valueType ?? Stramp;

        for (let i = 0; i < length; i++) {
            const key = keyType.read(bind);
            result.set(key, valueType.read(bind));
        }

        return result;
    };

    unsafeSize(map: T): number {
        const keyType = this.keyType ?? Stramp;
        const valueType = this.valueType ?? Stramp;

        let size = this.lengthBinSize;

        for (const [key, value] of map) {
            size += keyType.unsafeSize(key);
            size += valueType.unsafeSize(value);
        }

        return size;
    };

    findProblem(map: any, strict = false) {
        if (map === null || typeof map !== "object") return this.makeProblem("Expected an object");

        const keyType = this.keyType ?? Stramp;
        const valueType = this.valueType ?? Stramp;

        for (const [key, value] of Object.entries(map)) {
            const keyError = keyType.findProblem(key, strict);
            if (keyError) return keyError.shifted(`[${JSON.stringify(key)}]`, this);

            const valueError = valueType.findProblem(value, strict);
            if (valueError) return valueError.shifted(`[${JSON.stringify(key)}]`, this);
        }
    };

    get sample(): T {
        return <T>new Map;
    };

    adapt(value: any): T {
        if (value === null || typeof value !== "object") this.makeProblem("Expected an object").throw();

        const map = new Map;
        const keys = Object.keys(value);
        const maxLength = 1 << this.lengthBinSize;
        if (keys.length >= maxLength) keys.length = maxLength - 1;

        for (const key of keys) {
            map.set(this.keyType.adapt(key), this.valueType ? this.valueType.adapt(value[key]) : value[key]);
        }

        return super.adapt(map);
    };

    withKeyType<N extends Bin>(key: N) {
        const o = <MapBinConstructor<N, VType>><any>this.copy(false);
        o.keyType = key;
        o.init();
        return o;
    };

    withValueType<N extends Bin>(val: N) {
        const o = <MapBinConstructor<KType, N>><any>this.copy(false);
        o.valueType = val;
        o.init();
        return o;
    };

    withLengthBin<N extends Bin>(len: N) {
        const o = this.copy(false);
        o.lengthBin = len;
        o.init();
        return o;
    };

    copy(init = true) {
        const o = super.copy();
        o.keyType = this.keyType;
        o.valueType = this.valueType;
        o.lengthBin = this.lengthBin;
        if (init) this.init();
        return o;
    };
}

export default new MapBinConstructor(null, null, DefaultLengthBin).init();