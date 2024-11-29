import {Bin} from "../Bin";
import Stramp, {BufferIndex} from "../Stramp";

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

    copy() {
        const o = super.copy();
        o.values = <any>this.values.slice();
        o.idBin = this.idBin;
        o.idBinSize = this.idBinSize;
        return o;
    };
}