import {Bin} from "../Bin";
import {BufferIndex} from "../BufferIndex";
import UBigIntBin from "./UBigIntBin";
import {bigint} from "../Stramp";

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

    findProblem(value: any, _: any) {
        if (typeof value === "number") value = BigInt(value);
        if (typeof value !== "bigint") return this.makeProblem("Expected a big integer");
        if (value > 0n) return this.makeProblem("Expected a non-positive big integer");
    };

    adapt(value: any) {
        if (typeof value === "number") value = BigInt(value);
        else if (typeof value !== "bigint") this.makeProblem("Expected a big integer").throw();

        return super.adapt(value > 0n ? -value : value);
    };
}