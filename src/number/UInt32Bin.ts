import {BufferIndex} from "../BufferIndex";
import IntBaseBin from "./base/IntBaseBin";

export default new class UInt32Bin extends IntBaseBin {
    name = "u32";

    min = 0;
    max = 4294967295;
    bytes = 4;
    signed = false;

    unsafeWrite(bind: BufferIndex, value: number) {
        bind.writeUInt32(value);
    };

    read(bind: BufferIndex) {
        return bind.readUInt32();
    };
}