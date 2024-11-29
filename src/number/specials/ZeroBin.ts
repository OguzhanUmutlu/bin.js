import {Bin} from "../../Bin";

export default new class ZeroBin extends Bin<0> {
    name = "0";
    sample = 0 as const;

    unsafeWrite() {
    };

    read() {
        return 0 as const;
    };

    unsafeSize() {
        return 0;
    };

    findProblem(value: any, strict = false) {
        if (strict && value !== 0) return this.makeProblem("Expected 0");
    };
}