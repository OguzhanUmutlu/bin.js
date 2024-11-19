import {Bin} from "../../Bin";

export default new class UndefinedBin extends Bin<undefined> {
    name = "undefined";
    sample = undefined;

    unsafeWrite() {
    };

    read() {
        return undefined;
    };

    unsafeSize() {
        return 0;
    };

    findProblem(value: any, strict = false): string | void {
        if (strict && value !== undefined) return "Expected undefined";
    };
}