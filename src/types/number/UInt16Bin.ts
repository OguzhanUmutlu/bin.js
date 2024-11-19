import {BufferIndex} from "../../BufferIndex";
import IntBaseBin from "./base/IntBaseBin";

export default new class UInt16Bin extends IntBaseBin {
    name = "u16";

    min = 0;
    max = 65535;
    bytes = 2;
    signed = false;

    unsafeWrite(bind: BufferIndex, value: number) {
        bind.writeUInt16(value);
    };

    read(bind: BufferIndex) {
        return bind.readUInt16();
    };
}