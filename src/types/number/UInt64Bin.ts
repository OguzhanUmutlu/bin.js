import {BufferIndex} from "../../BufferIndex";
import BigIntBaseBin from "./base/BigIntBaseBin";

export default new class UInt64Bin extends BigIntBaseBin {
    name = "u64";

    min = 0n;
    max = 18446744073709551615n;
    bytes = 8;

    unsafeWrite(bind: BufferIndex, value: bigint) {
        bind.writeUInt64(BigInt(value));
    };

    read(bind: BufferIndex) {
        return bind.readUInt64();
    };
}