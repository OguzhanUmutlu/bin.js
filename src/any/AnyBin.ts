import {Bin} from "../Bin";
import {BufferIndex} from "../BufferIndex";
import {AnyValueBinConstructor} from "./AnyValueBin";

export class AnyBinConstructor<Bins extends Bin[]> extends Bin<Bins[number]["__TYPE__"]> {
    name = "any";

    constructor(public bins: Bins) {
        super();
    }

    getTypeOf<T>(value: T): Bin<T> | null {
        for (let i = 0; i < this.bins.length; i++) {
            const bin = this.bins[i];
            if (!bin.findProblem(value, true)) return <any>bin;
        }

        return null;
    };

    unsafeWrite(bind: BufferIndex, value: any, type = this.getTypeOf(value)!) {
        const id = this.bins.indexOf(type);
        bind.push(id);
        return type.unsafeWrite(bind, value);
    };

    read(bind: BufferIndex) {
        const id = bind.shift()!;
        const type = this.bins[id];
        return type.read(bind);
    };

    unsafeSize(value: any, type = this.getTypeOf(value)!): number {
        return type.unsafeSize(value) + 1;
    };

    findProblem(value: any, _ = false, type_ = this.getTypeOf(value)!) {
        if (!type_) return this.makeProblem("Unsupported type");
    };

    get sample() {
        return this.bins[0].sample;
    };

    of<T extends Bin[]>(...bins: T) {
        const o = <AnyBinConstructor<T>><any>this.copy();
        o.bins = bins;
        return o;
    };

    ofValues<T extends any[]>(...values: T) {
        return new AnyValueBinConstructor(values);
    };

    copy() {
        const o = super.copy();
        o.bins = <any>this.bins.slice();
        return o;
    };
}

export default new AnyBinConstructor([]);