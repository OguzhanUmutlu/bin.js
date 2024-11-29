import {BufferIndex} from "../BufferIndex";
import IntBaseBin from "./base/IntBaseBin";

export default new class UInt8Bin extends IntBaseBin {
    name = "u8";

    min = 0;
    max = 255;
    bytes = 1;
    signed = false;

    unsafeWrite(bind: BufferIndex, value: number) {
        bind.writeUInt8(value);
    };

    read(bind: BufferIndex) {
        return bind.readUInt8();
    };
}