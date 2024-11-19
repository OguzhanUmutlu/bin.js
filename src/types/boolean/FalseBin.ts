import {Bin} from "../../Bin";

export default new class FalseBin extends Bin<false> {
    name = "false";
    sample = false as const;

    unsafeWrite() {
    };

    read() {
        return false as const;
    };

    unsafeSize() {
        return 0;
    };

    findProblem(value: any, strict = false): string | void {
        if (strict && value !== false) return "Expected false";
    };
}