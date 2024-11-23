import {Bin} from "../../Bin";
import {BufferIndex} from "../../BufferIndex";

export default new class BooleanBin extends Bin<boolean> {
    name = "bool";
    sample = false;

    unsafeWrite(bind: BufferIndex, value: boolean) {
        bind.push(+value);
    };

    read(bind: BufferIndex) {
        return Boolean(bind.shift());
    };

    unsafeSize() {
        return 1;
    };

    findProblem(value: any, _: any) {
        if (typeof value !== "boolean") return this.makeProblem("Expected a boolean");
    };
}
