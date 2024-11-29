import {Bin} from "../Bin";
import {BufferIndex} from "../BufferIndex";
import ObjectStructBinConstructor from "./ObjectStructBin";
import Stramp from "../Stramp";
import IntBaseBin from "../number/base/IntBaseBin";
import {DefaultLengthBin, DefaultStringBin} from "../Utils";
import {StringBin} from "../string/StringBin";

class ObjectBinConstructor<
    VType extends Bin,
    VObject extends Record<string, VType["__TYPE__"]> = Record<string, VType["__TYPE__"]>,
    T = VObject
> extends Bin<T> {
    name: string;
    lengthBinSize: number;

    constructor(
        public keyType: StringBin,
        public valueType: VType | null,
        public classConstructor: ((obj: VObject) => T),
        public baseName: string | null,
        public lengthBin: Bin<number>
    ) {
        super();
    };

    init() {
        this.name = this.baseName ?? `Object<${this.keyType.name}, ${this.valueType ? this.valueType.name : "any"}>`;
        this.lengthBinSize = this.lengthBin.unsafeSize(1);

        return this;
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
        if (value === null || typeof value !== "object") return this.makeProblem("Expected an object");

        const keyType = this.keyType;
        const valueType = this.valueType ?? Stramp;

        const keys = Object.keys(value);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const keyProblem = keyType.findProblem(key, strict);
            if (keyProblem) return keyProblem.shifted(`[${JSON.stringify(key)}]`, this);

            const val = value[key];
            const valueProblem = valueType.findProblem(val, strict);
            if (valueProblem) return valueProblem.shifted(`[${JSON.stringify(key)}]`, this);
        }
    };

    get sample(): T {
        return this.classConstructor(<any>{});
    };

    keyTyped<N extends StringBin>(key: N) {
        const o = this.copy(false);
        o.keyType = key;
        o.init();
        return o;
    };

    valueTyped<N extends Bin<N>>(val: N) {
        const o = <ObjectBinConstructor<N>><any>this.copy(false);
        o.valueType = val;
        o.init();
        return o;
    };

    lengthBytes<N extends IntBaseBin>(len: N) {
        const o = this.copy(false);
        o.lengthBin = len;
        o.init();
        return o;
    };

    withConstructor<N extends (obj: VObject) => T>(cons: N) {
        const o = this.copy(false);
        o.classConstructor = cons;
        o.init();
        return o;
    };

    struct<T extends { [k: string]: Bin }>(data: T) {
        return new ObjectStructBinConstructor(data, r => r, this.baseName).init();
    };

    copy(init = true) {
        const o = super.copy();
        o.keyType = this.keyType;
        o.valueType = this.valueType;
        o.classConstructor = this.classConstructor;
        o.baseName = this.baseName;
        o.lengthBin = this.lengthBin;
        if (init) o.init();
        return o;
    };
}

export default new ObjectBinConstructor(DefaultStringBin, null, r => r, null, DefaultLengthBin).init();