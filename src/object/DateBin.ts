import {Bin} from "../Bin";
import {BufferIndex} from "../BufferIndex";

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

    findProblem(value: any, strict = false) {
        if (!(value instanceof Date)) {
            if (strict || typeof value !== "number") return this.makeProblem("Expected a Date");
            if (value < 0) return this.makeProblem("Expected a positive number");
        }
    };

    adapt(value: any): Date {
        if (typeof value === "number" || typeof value === "string") value = new Date(value);

        if (value === new Date("") || !(value instanceof Date)) value = this.sample;

        return super.adapt(value);
    };
}