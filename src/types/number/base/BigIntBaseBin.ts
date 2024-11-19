import {Bin} from "../../../Bin";

export default abstract class BigIntBaseBin extends Bin<bigint | number> {
    sample = 0n;

    abstract min: bigint;
    abstract max: bigint;
    abstract bytes: number;

    unsafeSize() {
        return this.bytes;
    };

    findProblem(value: any, _: any): string | void {
        if (typeof value === "number") value = BigInt(value);
        if (typeof value !== "bigint") return "Expected a big integer";
        if (value < this.min || value > this.max) return `Expected a number between ${this.min} and ${this.max}`;
    };
}