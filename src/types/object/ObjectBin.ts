import {Bin} from "../../Bin";
import {BufferIndex} from "../../BufferIndex";
import ObjectStructBinConstructor from "./ObjectStructBin";
import {AnyStringBin} from "../string/LengthBasedStringBin";
import Stramp from "../../Stramp";
import IntBaseBin from "../number/base/IntBaseBin";
import {DefaultLengthBin, DefaultStringBin} from "../../Utils";

class ObjectBinConstructor<
    VType extends Bin,
    VObject extends Record<string, VType["__TYPE__"]>,
    T
> extends Bin<T> {
    name: string;
    lengthBinSize: number;

    constructor(
        public keyType: AnyStringBin,
        public valueType: VType | null,
        public classConstructor: ((obj: VObject) => T),
        public baseName: string | null,
        public lengthBin: Bin<number>
    ) {
        super();
        this.name = baseName ?? `Object<${keyType.name}, ${valueType ? valueType.name : "any"}>`;
        this.lengthBinSize = this.lengthBin.unsafeSize(1);
    };

    unsafeWrite(bind: BufferIndex, value: T) {
        const keys = Object.keys(<any>value);
        const length = keys.length;
        this.lengthBin.unsafeWrite(bind, length);
        const valueType = this.valueType ?? Stramp;

        for (let i = 0; i < length; i++) {
            const key = keys[i];
            this.keyType.unsafeWrite(bind, key);
            valueType.unsafeWrite(bind, value[<keyof T>key]);
        }
    };

    read(bind: BufferIndex): T {
        const length = this.lengthBin.read(bind);
        const result = <any>{};
        const valueType = this.valueType ?? Stramp;

        for (let i = 0; i < length; i++) {
            const key = this.keyType.read(bind);
            result[key] = valueType.read(bind);
        }

        return result;
    };

    unsafeSize(value: T): number {
        const keys = Object.keys(<any>value);
        let size = this.lengthBinSize;
        const valueType = this.valueType ?? Stramp;

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            size += this.keyType.unsafeSize(key);
            size += valueType.unsafeSize(value[<keyof T>key]);
        }

        return size;
    };

    findProblem(value: any, strict = false) {
        if (value === null || typeof value !== "object") return "Expected an object";

        const keyType = this.keyType;
        const valueType = this.valueType ?? Stramp;

        const keys = Object.keys(value);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const keyProblem = keyType.findProblem(key, strict);
            if (keyProblem) return `Object key failed: ${keyProblem}`;

            const val = value[key];
            const valueProblem = valueType.findProblem(val, strict);
            if (valueProblem) return `Object value failed: ${valueProblem}`;
        }
    };

    get sample(): T {
        return this.classConstructor(<any>{});
    };

    keyTyped<N extends AnyStringBin>(key: N) {
        return new ObjectBinConstructor(key, this.valueType, this.classConstructor, this.baseName, this.lengthBin);
    };

    valueTyped<N extends any>(val: Bin<N>) {
        return new ObjectBinConstructor(this.keyType, val, this.classConstructor, this.baseName, this.lengthBin);
    };

    lengthBytes<N extends IntBaseBin>(len: N) {
        return new ObjectBinConstructor(this.keyType, this.valueType, this.classConstructor, this.baseName, len);
    };

    withConstructor<N extends (obj: VObject) => T>(cons: N) {
        return new ObjectBinConstructor(this.keyType, this.valueType, cons, this.baseName, this.lengthBin);
    };

    struct<T extends { [k: string]: Bin }>(data: T) {
        return new ObjectStructBinConstructor(data, r => r, this.baseName);
    };
}

export default new ObjectBinConstructor(DefaultStringBin, null, r => r, null, DefaultLengthBin);