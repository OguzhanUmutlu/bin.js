import {Bin} from "../Bin";
import {BufferIndex} from "../BufferIndex";
import Stramp from "../Stramp";

type so<SD extends Record<string, Bin>> = { [k in keyof SD]: SD[k]["__TYPE__"] };
type ExcludeKeys<Obj, Keys extends string[]> = {
    [K in keyof Obj as K extends Keys[number] ? never : K]: Obj[K];
};

export default class ObjectStructBinConstructor<
    StructData extends { [k: string]: Bin } = { [k: string]: Bin },
    StructObject extends so<StructData> = so<StructData>,
    T = StructObject
> extends Bin<T> {
    name = "";

    constructor(
        public structData: StructData,
        public classConstructor: ((obj: StructObject) => T),
        public baseName: string | null
    ) {
        super();
    };

    init() {
        const objName = `{ ${Object.keys(this.structData).map(i => `${i}: ${this.structData[i].name}`).join(", ")} }`;
        this.name = this.baseName ?? objName;
        const newStructData = <any>{};
        const keys = Object.keys(this.structData).sort();

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            let v = this.structData[key];
            if (!(v instanceof Bin)) v = Stramp.getStrictTypeOf(v);
            newStructData[key] = v;
        }

        this.structData = newStructData;

        return this;
    };

    unsafeWrite(bind: BufferIndex, value: T) {
        const structData = this.structData!;
        const keys = Object.keys(structData);

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const type = structData[key];
            type.unsafeWrite(bind, value[key]);
        }
    };

    read(bind: BufferIndex): T {
        const structData = this.structData!;
        const keys = Object.keys(structData);
        const result = <any>{};

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const type = structData[key];
            result[key] = type.read(bind);
        }

        return this.classConstructor(result);
    };

    unsafeSize(value: T): number {
        const structData = this.structData!;
        const keys = Object.keys(structData);
        let size = 0;

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const type = structData[key];
            size += type.unsafeSize(value[key]);
        }

        return size;
    };

    findProblem(value: any, strict = false) {
        if (value === null || typeof value !== "object") return this.makeProblem("Expected an object");

        const structData = this.structData!;
        const keys = Object.keys(structData);

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const type = structData[key];
            const problem = type.findProblem(value[key], strict);
            if (problem) return problem.shifted(`[${JSON.stringify(key)}]`, this);
        }
    };

    get sample(): T {
        const obj = <any>{};
        const structData = this.structData!;
        const keys = Object.keys(structData);

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const type = structData[key];
            obj[key] = type.sample;
        }

        return this.classConstructor(obj);
    };

    adapt(value: any): T {
        if (value === null || typeof value !== "object") value = {};

        const obj = <StructObject>{};
        const keys = Object.keys(value);

        for (const key of this.keys()) {
            const type = this.structData[key];
            obj[key] = keys.includes(<string>key) ? type.adapt(value[key]) : type.sample;
        }

        return super.adapt(this.classConstructor(obj));
    };

    keys() {
        return <(keyof StructData)[]>Object.keys(this.structData);
    };

    withConstructor<N>(classConstructor: ((obj: StructObject) => N)) {
        const o = <ObjectStructBinConstructor<StructData, StructObject, N>><any>this.copy();
        o.classConstructor = classConstructor;
        return o;
    };

    extend<N extends { [k: string]: Bin }>(d: N | ObjectStructBinConstructor<N>) {
        const o = <ObjectStructBinConstructor<StructData & N>><any>this.copy(false);
        const data = d instanceof ObjectStructBinConstructor ? d.structData : d;

        o.structData = <any>{...this.structData, ...data};
        o.init();
        return o;
    };

    excludeKeys<K extends (keyof StructData & string)[]>(...keys: K) {
        const o = this.copy(false);
        const structData = <any>{};
        const keysToKeep = Object.keys(this.structData).filter(k => !keys.includes(k));

        for (let i = 0; i < keysToKeep.length; i++) {
            const key = keysToKeep[i];
            structData[key] = this.structData[key];
        }

        o.structData = structData;
        o.init();
        return <ObjectStructBinConstructor<ExcludeKeys<StructData, K>>><unknown>o;
    };

    copy(init = true) {
        const o = super.copy();
        o.structData = this.structData;
        o.classConstructor = this.classConstructor;
        o.baseName = this.baseName;
        if (init) o.init();
        return o;
    };
}