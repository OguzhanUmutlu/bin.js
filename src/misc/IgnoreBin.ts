import {Bin} from "../Bin";
import {BufferIndex} from "../BufferIndex";

export default new class IgnoreBin extends Bin<undefined> {
    name = "Ignore";
    sample = undefined;

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
}