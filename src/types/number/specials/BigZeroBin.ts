import {Bin} from "../../../Bin";

export default new class BigZeroBin extends Bin<0n> {
    name = "0n";
    sample = 0n as const;

    unsafeWrite() {
    };

    read() {
        return 0n as const;
    };

    unsafeSize() {
        return 0;
    };

    findProblem(value: any, strict = false): string | void {
        if (strict && value !== 0n) return "Expected 0n";
    };
}