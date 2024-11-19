import {Bin} from "../../Bin";
import {BufferIndex} from "../../BufferIndex";

export default class ObjectStructBinConstructor<
    StructData extends { [k: string]: Bin },
    StructObject extends { [k in keyof StructData]: StructData[k]["__TYPE__"] },
    T = StructObject
> extends Bin<T> {
    name = "";

    constructor(
        public structData: StructData,
        public classConstructor: ((obj: StructObject) => T),
        public baseName: string | null
    ) {
        super();

        const objName = `{ ${Object.keys(structData).map(i => `${i}: ${structData[i].name}`).join(", ")} }`;
        this.name = baseName ?? objName;
        const newStructData = <any>{};
        const keys = Object.keys(structData).sort();

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            newStructData[key] = structData[key];
        }

        this.structData = newStructData;
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

    findProblem(value: any, strict = false): string | void | undefined {
        if (value === null || typeof value !== "object") return "Expected an object";

        const structData = this.structData!;
        const keys = Object.keys(structData);

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const type = structData[key];
            const problem = type.findProblem(value[key], strict);
            if (problem) return problem;
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

    withConstructor<N>(classConstructor: ((obj: StructObject) => N)) {
        return new ObjectStructBinConstructor<StructData, StructObject, N>(this.structData, classConstructor, this.baseName);
    };

    extend<N extends { [k: string]: Bin }>(data: N) {
        return new ObjectStructBinConstructor<StructData & N, StructObject & { [k in keyof N]: N[k]["__TYPE__"] }, T>(
            <any>{...this.structData, data}, this.classConstructor, this.baseName
        );
    };
}