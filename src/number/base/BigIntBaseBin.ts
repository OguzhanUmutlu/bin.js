import {Bin} from "../../Bin";

export default abstract class BigIntBaseBin extends Bin<bigint | number> {
    sample = 0n;

    abstract min: bigint;
    abstract max: bigint;
    abstract bytes: number;

    unsafeSize() {
        return this.bytes;
    };

    findProblem(value: any, _: any) {
        if (typeof value === "number") value = BigInt(value);
        if (typeof value !== "bigint") return this.makeProblem("Expected a big integer");
        if (value < this.min || value > this.max) return this.makeProblem(`Expected a number between ${this.min} and ${this.max}`);
    };

    adapt(value: any) {
        if (typeof value === "number") value = BigInt(value);
        if (typeof value !== "bigint") this.makeProblem("Expected a big integer").throw();

        return super.adapt(value > this.max ? this.max : (value < this.min ? this.min : value));
    };
}