import {Bin} from "./Bin";

export class StrampProblem {
    constructor(public problem: string, public baseBin: Bin, public lastBin: Bin, public source = "") {
    };

    shifted(source: string, bin: Bin) {
        return new StrampProblem(this.problem, bin, this.lastBin, source + this.source);
    };

    own(bin: Bin) {
        this.baseBin = bin;
        return this;
    };

    toString() {
        return this.baseBin.name + this.source + (this.baseBin === this.lastBin ? "" : ` -> ${this.lastBin.name}`) + ": " + this.problem;
    };
}