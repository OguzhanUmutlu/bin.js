import {Bin} from "../../Bin";
import {BufferIndex} from "../../BufferIndex";
import UBigIntBin from "./UBigIntBin";

export default new class NegBigIntBin extends Bin<bigint> {
    name = "nbi";
    sample = -1n;

    unsafeWrite(bind: BufferIndex, value: bigint) {
        UBigIntBin.unsafeWrite(bind, -value);
    };

    read(bind: BufferIndex) {
        return -UBigIntBin.read(bind);
    };

    unsafeSize(value: bigint) {
        return UBigIntBin.unsafeSize(-value);
    };

    findProblem(value: any, _: any): string | void {
        if (typeof value !== "bigint") return "Expected a big integer";
        if (value > 0n) return "Expected a non-positive big integer";
    };
}