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

    adapt(value: any) {
        if (typeof value === "string" || typeof value === "bigint") value = Number(value);
        else if (typeof value !== "number") this.makeProblem("Expected a number").throw();

        if (isNaN(value)) value = this.sample;

        if (value > this.max) value = this.max;
        if (value < this.min) value = this.min;
        if (this.signed !== (Math.sign(value) === -1)) value *= -1;
        if (!Number.isInteger(value)) value = Math.round(value);

        return super.adapt(value);
    };
}