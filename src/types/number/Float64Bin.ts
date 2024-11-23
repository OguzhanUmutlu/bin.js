import {Bin} from "../../Bin";
import {BufferIndex} from "../../BufferIndex";

export default new class Float64Bin extends Bin<number> {
    name = "f64";
    sample = 0;

    unsafeWrite(bind: BufferIndex, value: number) {
        bind.writeFloat64(value);
    };

    read(bind: BufferIndex) {
        return bind.readFloat64();
    };

    unsafeSize() {
        return 8;
    };

    findProblem(value: any) {
        if (typeof value !== "number") return this.makeProblem("Expected a number");
    };
}