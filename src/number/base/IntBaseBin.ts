import {Bin} from "../../Bin";

export default abstract class IntBaseBin extends Bin<number> {
    sample = 0;

    abstract min: number;
    abstract max: number;
    abstract bytes: number;
    abstract signed: boolean;

    unsafeSize() {
        return this.bytes;
    };

    findProblem(value: any, _: any) {
        if (typeof value !== "number") return this.makeProblem("Expected a number");
        if (!Number.isInteger(value)) return this.makeProblem("Expected an integer");
        if (value < this.min || value > this.max) return this.makeProblem(`Expected a number between ${this.min} and ${this.max}`);
    };
}