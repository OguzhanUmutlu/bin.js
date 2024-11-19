import {Bin} from "../../../Bin";

export default new class InfinityBin extends Bin<number> {
    name = "+inf";
    sample = Infinity;

    unsafeWrite() {
    };

    read() {
        return Infinity;
    };

    unsafeSize() {
        return 0;
    };

    findProblem(value: any, strict = false): string | void {
        if (strict && value !== Infinity) return "Expected +Infinity";
    };
}