import {Bin} from "../../Bin";
import {BufferIndex} from "../../BufferIndex";

export default new class Float32Bin extends Bin<number> {
    name = "f32";
    sample = 0;

    unsafeWrite(bind: BufferIndex, value: number) {
        bind.writeFloat32(value);
    };

    read(bind: BufferIndex) {
        return bind.readFloat32();
    };

    unsafeSize() {
        return 4;
    };

    findProblem(value: any, strict = false) {
        if (typeof value !== "number") return this.makeProblem("Expected a number");
        if (strict) {
            if (value > 3.4028235e38 || value < -3.4028235e38) return this.makeProblem("Expected a number between -3.4028235e38 and 3.4028235e38");
            if (Math.abs(value) < 1.4e-45 && value !== 0) return this.makeProblem("Expected a number not too small. (-1.4e-45, 1.4e-45) is too small");
        }
    };
}