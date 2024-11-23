import {Bin} from "../../Bin";
import {BufferIndex} from "../../BufferIndex";
import {AnyStringBin} from "../string/LengthBasedStringBin";
import Stramp from "../../Stramp";
import {DefaultLengthBin} from "../../Utils";

class MapBinConstructor<
    KType extends Bin,
    VType extends Bin,
    T extends Map<KType["__TYPE__"], VType["__TYPE__"]>
> extends Bin<T> {
    name: string;

    constructor(
        public keyType: KType | null,
        public valueType: VType | null,
        public lengthBin: Bin<number>
    ) {
        super();
        this.name = `Map<${keyType ? keyType.name : "any"}, ${valueType ? valueType.name : "any"}>`;
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

        let size = this.lengthBin.unsafeSize(map.size);

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

    withKeyType<N extends AnyStringBin>(key: N) {
        return new MapBinConstructor(key, this.valueType, this.lengthBin);
    };

    withValueType<N extends any>(val: Bin<N>) {
        return new MapBinConstructor(this.keyType, val, this.lengthBin);
    };

    withLengthBin<N extends Bin>(len: N) {
        return new MapBinConstructor(this.keyType, this.valueType, len);
    };
}

export default new MapBinConstructor(null, null, DefaultLengthBin);