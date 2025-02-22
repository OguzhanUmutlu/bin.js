import {Bin} from "../Bin";

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

    findProblem(value: any, strict = false) {
        if (strict && value !== null) return this.makeProblem("Expected null");
    };

    adapt() {
        return null;
    };
}