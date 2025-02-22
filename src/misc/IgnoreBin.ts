import {Bin} from "../Bin";
import {BufferIndex} from "../BufferIndex";

export default new class IgnoreBin extends Bin<void> {
    name = "Ignore";
    sample = <void>undefined;

    unsafeWrite(_: BufferIndex, __: any) {
    };

    read(_: BufferIndex) {
        return undefined;
    };

    unsafeSize(_: any) {
        return 0;
    };

    findProblem(_: any, __?: any) {
    };

    adapt() {
    };
}