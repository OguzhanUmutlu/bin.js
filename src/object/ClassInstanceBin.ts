import {Bin} from "../Bin";
import {BufferIndex} from "../BufferIndex";
import ObjectBin from "./ObjectBin";
import Stramp from "../Stramp";
import UInt8Bin from "../number/UInt8Bin";

type EmptyClassType = { new(): any };

export default new class ClassInstanceBin<K extends EmptyClassType[]> extends Bin<InstanceType<K[number]>> {
    name = "date";
    classes: EmptyClassType[] = [];
    numBin: Bin<number> = UInt8Bin;
    numBinSize = 1;

    add<V extends EmptyClassType>(clazz: V) {
        this.classes.push(clazz);
        this.classes = this.classes.sort((a, b) => a.name < b.name ? -1 : 1);
        this.numBin = Stramp.getTypeOf(this.classes.length);
        this.numBinSize = this.numBin.unsafeSize(1);
        return <ClassInstanceBin<[V, ...K]>><any>this;
    };

    unsafeWrite(bind: BufferIndex, value: any): void {
        this.numBin.unsafeWrite(bind, this.classes.indexOf(value.constructor));
        ObjectBin.unsafeWrite(bind, value);
    };

    read(bind: BufferIndex): any {
        const index = this.numBin.read(bind);
        const obj = ObjectBin.read(bind);
        const inst = new this.classes[index];
        Object.assign(inst, obj);
        return inst;
    };

    unsafeSize(value: any): number {
        return this.numBinSize + ObjectBin.unsafeSize(value);
    };

    findProblem(value: any, strict = false) {
        if (value === null || typeof value !== "object") return this.makeProblem("Expected an object");

        const index = this.classes.indexOf(value.constructor);
        if (index === -1) return this.makeProblem(`Expected one of ${this.classes.map(c => c.name).join(", ")}`);

        const problem = ObjectBin.findProblem(value, strict);
        if (problem) return problem;
    };

    get sample(): any {
        throw new Error("Cannot make a sample for a ClassInstanceBin, this was most likely caused by instantiating a new struct that includes a ClassInstanceBin.");
    };
}