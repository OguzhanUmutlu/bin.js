import {BufferIndex} from "../BufferIndex";
import IntBaseBin from "./base/IntBaseBin";

export default new class Int16Bin extends IntBaseBin {
    name = "i16";

    min = -32768;
    max = 32767;
    bytes = 2;
    signed = true;

    unsafeWrite(bind: BufferIndex, value: number) {
        bind.writeInt16(value);
    };

    read(bind: BufferIndex) {
        return bind.readInt16();
    };
}