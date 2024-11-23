import {BufferIndex} from "./BufferIndex";
import {AnyBinConstructor} from "./types/AnyBin";
import {StrampProblem} from "./StrampProblem";

type HolderBuffer<Data = any, Owner extends Bin = Bin> = Buffer & {
    __buffer__data__: Data,
    __buffer__owner__: Owner
};
let _id = 1;
const bins: Record<number, Bin> = {};

export function getBinByInternalId(id: number): Bin | null {
    return bins[id] ?? null;
}

export abstract class Bin<T = any> {
    static AnyBin: AnyBinConstructor<any>;
    internalId = _id++;
    __TYPE__ = <T>null;

    abstract name: string;

    abstract unsafeWrite(bind: BufferIndex, value: T | Readonly<T>): void;
    abstract read(bind: BufferIndex): T;
    abstract unsafeSize(value: T | Readonly<T>): number;
    abstract findProblem(value: any, strict?: boolean): StrampProblem | void;
    abstract get sample(): T;

    constructor() {
        bins[this.internalId] = this;
    };

    write(bind: BufferIndex, value: any) {
        this.assert(value);
        return this.unsafeWrite(bind, value);
    };

    getSize(value: any) {
        this.assert(value);
        return this.unsafeSize(value);
    };

    assert(value: any) {
        const err = this.findProblem(value);
        if (err) throw new Error((err[0] ? err[0] + ": " : "") + err[1]);
    };

    serialize<K extends T>(value: K | Readonly<K>) {
        this.assert(value);

        // Since we just asserted, everything can be unsafe from here on out.
        const size = this.unsafeSize(value);

        const bind = BufferIndex.allocUnsafe(size);

        this.unsafeWrite(bind, value);

        return <HolderBuffer<K, this>>bind.buffer;
    };

    deserialize<Binder extends Buffer | HolderBuffer | BufferIndex>(
        bind: Binder
    ): Binder extends HolderBuffer ? (Binder["__buffer__owner__"] extends this ? Binder["__buffer__data__"] : T) : T {
        if (bind instanceof BufferIndex) return <any>this.read(bind);
        else return <any>this.read(new BufferIndex(bind, 0));
    };

    or<T extends Bin[]>(...type: T): AnyBinConstructor<[this, ...T]> {
        return Bin.AnyBin.of(this, ...type);
    };

    makeProblem(problem: string, source = "") {
        return new StrampProblem(problem, this, this, source);
    };
}