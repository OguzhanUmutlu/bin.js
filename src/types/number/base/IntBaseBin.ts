import {Bin} from "../../../Bin";

export default abstract class IntBaseBin extends Bin<number> {
    sample = 0;

    abstract min: number;
    abstract max: number;
    abstract bytes: number;
    abstract signed: boolean;

    unsafeSize() {
        return this.bytes;
    };

    findProblem(value: any, _: any): string | void {
        if (typeof value !== "number") return "Expected a number";
        if (!Number.isInteger(value)) return "Expected an integer";
        if (value < this.min || value > this.max) return `Expected a number between ${this.min} and ${this.max}`;
    };
}