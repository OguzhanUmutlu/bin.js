import {Bin} from "../../Bin";
import {BufferIndex} from "../../BufferIndex";
import UBigIntBin from "./UBigIntBin";

export default new class BigIntBin extends Bin<bigint> {
    name = "bi";
    sample = 0n;

    unsafeWrite(bind: BufferIndex, value: bigint) {
        bind.push(value < 0n ? 1 : 0);
        UBigIntBin.unsafeWrite(bind, value < 0n ? -value : value);
    };

    read(bind: BufferIndex) {
        return (bind.shift() ? -1n : 1n) * UBigIntBin.read(bind);
    };

    unsafeSize(value: bigint) {
        return UBigIntBin.unsafeSize(value) + 1;
    };

    findProblem(value: any, _: any) {
        if (typeof value !== "bigint") return this.makeProblem("Expected a big integer");
    };
}