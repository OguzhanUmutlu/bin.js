import {Bin} from "../Bin";
import {BufferIndex} from "../BufferIndex";
import Stramp from "../Stramp";

export default new class RegExpBin extends Bin<RegExp> {
    name = "date";
    sample = / /;

    unsafeWrite(bind: BufferIndex, value: RegExp): void {
        Stramp.unsafeWrite(bind, value.source);
    };

    read(bind: BufferIndex): RegExp {
        return Stramp.read(bind);
    };

    unsafeSize(value: RegExp): number {
        return Stramp.unsafeSize(value);
    };

    findProblem(value: any, _ = false) {
        if (!(value instanceof RegExp)) return this.makeProblem("Expected a RegExp");
    };
}