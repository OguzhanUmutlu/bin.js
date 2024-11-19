import {Bin} from "../../Bin";

export default new class NullBin extends Bin<null> {
    name = "null";
    sample = null;

    unsafeWrite() {
    };

    read() {
        return null;
    };

    unsafeSize() {
        return 0;
    };

    findProblem(value: any, strict = false): string | void {
        if (strict && value !== null) return "Expected null";
    };
}