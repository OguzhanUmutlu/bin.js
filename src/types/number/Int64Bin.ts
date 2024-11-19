import {BufferIndex} from "../../BufferIndex";
import BigIntBaseBin from "./base/BigIntBaseBin";

export default new class Int64Bin extends BigIntBaseBin {
    name = "i64";

    min = -9223372036854775808n;
    max = 9223372036854775807n;
    bytes = 8;

    unsafeWrite(bind: BufferIndex, value: bigint) {
        bind.writeInt64(BigInt(value));
    };

    read(bind: BufferIndex) {
        return bind.readInt64();
    };
}