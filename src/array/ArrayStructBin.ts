import {Bin} from "../Bin";
import {BufferIndex} from "../BufferIndex";
import {ArrayBinConstructor} from "./ArrayBin";
import {DefaultLengthBin} from "../Utils";

export class ArrayStructBinConstructor<
    ClassType extends "array" | "set" | Iterable<any>,
    K extends any = any,
    T extends Iterable<K> = ClassType extends "array" ? K[] : (ClassType extends "set" ? Set<K> : ClassType)
> extends Bin<T> {
    public name: string;

    constructor(
        public typesName: (types: Bin[]) => string,
        public typeName: (type: Bin) => string,
        public fixedName: (fixed: number) => string,
        public fixedTypeName: (fixed: number, type: Bin) => string,
        public baseName: string,
        public types: Bin<K>[] | null = null,
        public baseClass: new (...args: any[]) => T
    ) {
        super();
    };

    init() {
        this.name = this.typesName(this.types);

        return this;
    };

    unsafeWrite(bind: BufferIndex, value: T): void {
        const arr = Array.from(value);
        const types = this.types!;
        for (let i = 0; i < types.length; i++) {
            types[i].unsafeWrite(bind, arr[i]);
        }
    };

    read(bind: BufferIndex): T {
        const types = this.types!;
        const length = types.length;
        const result = new Array(length);

        for (let i = 0; i < length; i++) {
            result[i] = types[i].read(bind);
        }

        return <any>this.baseClass === Array ? <any>result : new this.baseClass(result);
    };

    unsafeSize(value: T): number {
        let size = 0;
        const types = this.types!;
        const arr = Array.from(value);

        for (let i = 0; i < types.length; i++) {
            size += types[i].unsafeSize(arr[i]);
        }

        return size;
    };

    findProblem(value: any, strict = false) {
        if (value === null || typeof value !== "object" || !(Symbol.iterator in value)) return this.makeProblem("Expected an iterable");

        if (strict && value.constructor !== this.baseClass) return this.makeProblem(`Expected an iterable of ${this.baseName}`);

        const types = this.types!;
        const arr = Array.from(value);

        for (let i = 0; i < types.length; i++) {
            const type = types[i];
            const problem = type.findProblem(arr[i], strict);
            if (problem) return problem.shifted(`[${i}]`, this);
        }
    };

    get sample(): T {
        const types = this.types!;
        let result = new Array(types.length);

        for (let i = 0; i < types.length; i++) {
            result[i] = types[i].sample;
        }

        return new this.baseClass(result);
    };

    normal() {
        return new ArrayBinConstructor<ClassType, K, T>(
            this.typesName,
            this.typeName,
            this.fixedName,
            this.fixedTypeName,
            this.baseName,
            null,
            null,
            DefaultLengthBin,
            <any>this.baseClass
        );
    };

    copy(init = true) {
        const o = super.copy();
        o.typesName = this.typesName;
        o.typeName = this.typeName;
        o.fixedName = this.fixedName;
        o.fixedTypeName = this.fixedTypeName;
        o.baseName = this.baseName;
        o.types = this.types;
        o.baseClass = this.baseClass;
        if (init) o.init();
        return o;
    };
}