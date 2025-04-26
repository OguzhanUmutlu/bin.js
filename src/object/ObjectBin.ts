import {Bin} from "../Bin";
import {BufferIndex} from "../BufferIndex";
import ObjectStructBinConstructor from "./ObjectStructBin";
import Stramp from "../Stramp";
import IntBaseBin from "../number/base/IntBaseBin";
import {DefaultLengthBin, DefaultStringBin} from "../Utils";
import {StringBin} from "../string/StringBin";

class ObjectBinConstructor<
    VType extends Bin = Bin,
    VObject extends Record<string | number, VType["__TYPE__"]> = Record<string | number, VType["__TYPE__"]>,
    T = VObject
> extends Bin<T> {
    name: string;
    lengthBinSize: number;

    constructor(
        public readonly keyType: StringBin | Bin<number>,
        public readonly valueType: VType | null,
        public readonly classConstructor: ((obj: VObject) => T),
        public readonly baseName: string | null,
        public readonly lengthBin: Bin<number>
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
            this.keyType.unsafeWrite(bind, <never>(this.keyType instanceof StringBin ? key : +key));
            valueType.unsafeWrite(bind, value[<keyof T>key]);
        }
    };

    read(bind: BufferIndex): T {
        const length = this.lengthBin.read(bind);
        const result = <any>{};
        const valueType = this.valueType ?? Stramp;

        for (let i = 0; i < length; i++) {
            const key = this.keyType.read(bind);
            if (key === "__proto__" || key === "constructor" || key === "prototype") {
                throw new Error(`Forbidden key ${key}`);
            }
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
            size += this.keyType.unsafeSize(<never>(this.keyType instanceof StringBin ? key : +key));
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
            const keyProblem = keyType.findProblem(keyType instanceof StringBin ? key : +key, strict);
            if (keyProblem) return keyProblem.shifted(`[${JSON.stringify(key)}]`, this);

            const val = value[key];
            const valueProblem = valueType.findProblem(val, strict);
            if (valueProblem) return valueProblem.shifted(`[${JSON.stringify(key)}]`, this);
        }
    };

    get sample(): T {
        return this.classConstructor(<any>{});
    };

    adapt(value: any): T {
        if (value === null || typeof value !== "object") value = {};

        const obj = {};
        const keys = Object.keys(value);
        const maxLength = 1 << this.lengthBinSize;
        if (keys.length >= maxLength) keys.length = maxLength - 1;

        for (const key of keys) {
            obj[this.keyType.adapt(key)] = this.valueType ? this.valueType.adapt(value[key]) : value[key];
        }

        return super.adapt(this.classConstructor(<VObject>obj));
    };

    keyTyped<N extends StringBin | Bin<number>>(keyType: N) {
        const o = new ObjectBinConstructor(
            keyType,
            this.valueType,
            this.classConstructor,
            this.baseName,
            this.lengthBin
        );
        o.init();
        return o;
    };

    valueTyped<N extends Bin>(valueType: N) {
        const o = <ObjectBinConstructor<N>>new ObjectBinConstructor(
            this.keyType,
            valueType,
            this.classConstructor,
            this.baseName,
            this.lengthBin
        );
        o.init();
        return o;
    };

    lengthBytes<N extends IntBaseBin>(lengthBin: N) {
        const o = new ObjectBinConstructor(
            this.keyType,
            this.valueType,
            this.classConstructor,
            this.baseName,
            lengthBin
        );
        o.init();
        return o;
    };

    withConstructor<N extends (obj: VObject) => T>(cons: N) {
        const o = new ObjectBinConstructor(
            this.keyType,
            this.valueType,
            cons,
            this.baseName,
            this.lengthBin
        );
        o.init();
        return o;
    };

    struct<T extends { [k: string]: Bin }>(data: T) {
        return new ObjectStructBinConstructor(data, r => r, this.baseName).init();
    };

    copy(init = true) {
        const o = <this>new ObjectBinConstructor(
            this.keyType,
            this.valueType,
            this.classConstructor,
            this.baseName,
            this.lengthBin
        );
        if (init) o.init();
        return o;
    };
}

export default new ObjectBinConstructor(DefaultStringBin, null, r => r, null, DefaultLengthBin).init();