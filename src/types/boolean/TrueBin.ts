import {Bin} from "../../Bin";

export default new class TrueBin extends Bin<true> {
    name = "true";
    sample = true as const;

    unsafeWrite() {
    };

    read() {
        return true as const;
    };

    unsafeSize() {
        return 0;
    };

    findProblem(value: any, strict = false): string | void {
        if (strict && value !== true) return "Expected true";
    };
}