import {Bin} from "../Bin";
import {BufferIndex} from "../BufferIndex";
import Stramp from "../Stramp";

export class AnyValueBinConstructor<T extends any[]> extends Bin<T[number]> {
    name = "any";

    constructor(public values: T, public idBin = Stramp.getTypeOf(values.length), public idBinSize = idBin.unsafeSize(0)) {
        super();
    };

    unsafeWrite(bind: BufferIndex, value: T[number]) {
        const id = this.values.indexOf(value);
        this.idBin.unsafeWrite(bind, id);
    };

    read(bind: BufferIndex) {
        const id = this.idBin.read(bind);
        return this.values[id];
    };

    unsafeSize(_: T[number]) {
        return this.idBinSize;
    };

    findProblem(value: any, _?: boolean) {
        if (!this.values.includes(value)) return this.makeProblem("Unsupported value");
    };

    get sample() {
        throw new Error("Cannot make a sample for a AnyValueBin, this was most likely caused by instantiating a new struct that includes an AnyValueBin.");
    };
}

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
        return new AnyBinConstructor(bins);
    };

    ofValues<T extends any[]>(...values: T) {
        return new AnyValueBinConstructor(values);
    };
}

export default new AnyBinConstructor([]);