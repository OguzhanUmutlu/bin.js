import {Bin} from "../../Bin";
import {BufferIndex} from "../../BufferIndex";
import UInt8Bin from "../number/UInt8Bin";
import UInt16Bin from "../number/UInt16Bin";
import UInt32Bin from "../number/UInt32Bin";
import CStringBin from "./CStringBin";
import {Buffer} from "buffer";

export type AnyStringBin = LengthBasedStringBin | typeof CStringBin;

export default class LengthBasedStringBin extends Bin<string> {
    sample = "";
    lengthBytes: number;

    constructor(public name: string, public lengthBin: Bin<number>) {
        super();
        this.lengthBytes = this.lengthBin.unsafeSize(0);
    };

    unsafeWrite(bind: BufferIndex, value: string) {
        const length = Buffer.byteLength(value);
        this.lengthBin.unsafeWrite(bind, length);
        bind.write(value, length);
    };

    read(bind: BufferIndex) {
        const length = this.lengthBin.read(bind);
        return bind.toString("utf8", length);
    };

    unsafeSize(value: string) {
        return this.lengthBytes + value.length;
    };

    findProblem(value: any, _: any) {
        if (typeof value !== "string") return this.makeProblem("Expected a string");
        if (this.lengthBin.findProblem(value.length)) return this.makeProblem(`Expected string length to be a ${this.lengthBin.name}`);
    };
}

export const String8Bin = new LengthBasedStringBin("string8", UInt8Bin);
export const String16Bin = new LengthBasedStringBin("string16", UInt16Bin);
export const String32Bin = new LengthBasedStringBin("string32", UInt32Bin);
