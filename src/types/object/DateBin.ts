import {Bin} from "../../Bin";
import {BufferIndex} from "../../BufferIndex";

export default new class DateBin extends Bin<Date> {
    name = "date";
    sample = new Date(0);

    unsafeWrite(bind: BufferIndex, value: Date): void {
        bind.writeUInt32(value.getTime());
    };

    read(bind: BufferIndex): Date {
        return new Date(bind.readUInt32());
    };

    unsafeSize(): number {
        return 4;
    };

    findProblem(value: any, strict = false): string | void | undefined {
        if (!(value instanceof Date)) {
            if (strict || typeof value !== "number") return "Expected a Date";
            if (value < 0) return "Expected a positive number";
        }
    };
}