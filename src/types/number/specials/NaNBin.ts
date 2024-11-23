import {Bin} from "../../../Bin";

export default new class NaNBin extends Bin<number> {
    name = "NaN";
    sample = NaN;

    unsafeWrite() {
    };

    read() {
        return NaN;
    };

    unsafeSize() {
        return 0;
    };

    findProblem(value: any, strict = false) {
        if (strict && (typeof value !== "number" || !isNaN(value))) return this.makeProblem("Expected NaN");
    };
}