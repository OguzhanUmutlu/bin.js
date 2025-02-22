import {Bin} from "../Bin";
import {BufferIndex} from "../BufferIndex";
import {Buffer} from "buffer";

export default new class UBigIntBin extends Bin<bigint> {
    name = "ubi";
    sample = 0n;

    unsafeWrite(bind: BufferIndex, value: bigint) {
        let hex = BigInt(value).toString(16);
        if (hex.length % 2 === 1) hex = "0" + hex;

        const buf = Buffer.from(hex, "hex");

        bind.writeUInt16(buf.length);
        bind.writeBuffer(buf);
    };

    read(bind: BufferIndex) {
        const length = bind.readUInt16();

        return BigInt("0x" + bind.toString("hex", length));
    };

    unsafeSize(value: bigint) {
        let hex = value.toString(16);
        if (hex.length % 2 === 1) hex = "0" + hex;
        return hex.length / 2 + 2;
    };

    findProblem(value: any, _: any) {
        if (typeof value !== "bigint") return this.makeProblem("Expected a big integer");
        if (value < 0) return this.makeProblem("Expected a non-negative big integer");
    };

    adapt(value: any) {
        if (typeof value === "number") value = BigInt(value);
        else if (typeof value !== "bigint") this.makeProblem("Expected a big integer").throw();

        return super.adapt(value < 0n ? -value : value);
    };
}