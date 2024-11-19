import {Bin} from "../../Bin";
import {BufferIndex} from "../../BufferIndex";
import {Buffer} from "buffer";

export default new class CStringBin extends Bin<string> {
    name = "string";
    sample = "";
    lengthBytes = 0;

    unsafeWrite(bind: BufferIndex, value: string): void {
        bind.write(value);
        bind.push(0);
    };

    read(bind: BufferIndex): string {
        const start = bind.index;

        while (!bind.done && bind.incGet() !== 0) {
        }

        return bind.buffer.toString("utf8", start, bind.index - 1);
    };

    unsafeSize(value: string): number {
        return Buffer.byteLength(value, "utf8") + 1;
    };

    findProblem(value: any, _ = false): string | void | undefined {
        if (typeof value !== "string") return "Expected a string";
        const buf = Buffer.from(value, "utf8");
        for (let i = 0; i < buf.length; i++) {
            if (buf[i] === 0) return "String contains null byte, use sized strings(s8, s16, s32) to avoid this";
        }
    };
}