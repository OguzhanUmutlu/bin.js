import {Bin} from "../Bin";
import {BufferIndex} from "../BufferIndex";
import Stramp, {string} from "../Stramp";

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

    adapt(value: any): RegExp {
        if (typeof value === "string") {
            const sp = value.split("/");
            if (sp.length >= 3 && !sp[0] && sp.at(-1).split("").every(i => ["g", "i", "m", "s"].includes(i))) {
                value = new RegExp(value.split("/").slice(1, -1).join("/"), sp.at(-1));
            } else value = new RegExp(value)
        }

        return super.adapt(value);
    };
}