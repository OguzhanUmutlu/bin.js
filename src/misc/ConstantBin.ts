import {Bin} from "../Bin";
import {BufferIndex} from "../BufferIndex";

export class ConstantBinConstructor<T> extends Bin<T> {
    constructor(
        public name: string,
        public sample: T
    ) {
        super();
    };

    unsafeWrite(bind: BufferIndex, value: T | Readonly<T>): void {
    };

    read(bind: BufferIndex): T {
        return this.sample;
    };

    unsafeSize(value: T | Readonly<T>): number {
        return 0;
    };

    findProblem(value: any, strict?: boolean) {
        if (strict) {
            if (typeof this.sample === "number" && isNaN(this.sample) && (typeof value !== "number" || !isNaN(value))) {
                return this.makeProblem(`Expected the constant value NaN`);
            } else if (value !== this.sample) return this.makeProblem(`Expected the constant value ${this.sample}`);
        }
    };

    new<K>(name: string, value: K): ConstantBinConstructor<K> {
        return new ConstantBinConstructor(name, value);
    };

    adapt() {
        return this.sample;
    };

    copy() {
        const o = super.copy();
        o.name = this.name;
        o.sample = this.sample;
        return o;
    };
}

export default new ConstantBinConstructor("constant", "constant");