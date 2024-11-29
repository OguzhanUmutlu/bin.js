import {Buffer} from "buffer";

export class BufferIndex {
    static alloc(size: number) {
        return new BufferIndex(Buffer.alloc(size), 0);
    };

    static allocUnsafe(size: number) {
        return new BufferIndex(Buffer.allocUnsafe(size), 0);
    };

    constructor(public buffer: Buffer, public index: number) {
    };

    get current() {
        return this.buffer[this.index];
    };

    get done() {
        return this.index >= this.buffer.length;
    };

    peek(amount = 1) {
        return this.buffer[this.index + amount];
    };

    inc(amount = 1) {
        const now = this.index;
        this.index += amount;
        return now;
    };

    incGet(amount = 1) {
        const now = this.index;
        this.index += amount;
        return this.buffer[now];
    };

    push(byte: number) {
        this.buffer[this.index++] = byte;
    };

    shift(): number | null {
        return this.buffer[this.index++] ?? null;
    };

    readUInt8() {
        return this.buffer.readUint8(this.inc());
    };

    readUInt16() {
        return this.buffer.readUint16LE(this.inc(2));
    };

    readUInt32() {
        return this.buffer.readUint32LE(this.inc(4));
    };

    readUInt64() {
        return this.buffer.readBigUint64LE(this.inc(8));
    };

    readInt8() {
        return this.buffer.readInt8(this.inc());
    };

    readInt16() {
        return this.buffer.readInt16LE(this.inc(2));
    };

    readInt32() {
        return this.buffer.readInt32LE(this.inc(4));
    };

    readInt64() {
        return this.buffer.readBigInt64LE(this.inc(8));
    };

    readFloat32() {
        return this.buffer.readFloatLE(this.inc(4));
    };

    readFloat64() {
        return this.buffer.readDoubleLE(this.inc(8));
    };

    writeUInt8(value: number) {
        this.buffer.writeUInt8(value, this.inc());
    };

    writeUInt16(value: number) {
        this.buffer.writeUInt16LE(value, this.inc(2));
    };

    writeUInt32(value: number) {
        this.buffer.writeUInt32LE(value, this.inc(4));
    };

    writeUInt64(value: number | bigint) {
        this.buffer.writeBigUInt64LE(BigInt(value), this.inc(8));
    };

    writeInt8(value: number) {
        this.buffer.writeInt8(value, this.inc());
    };

    writeInt16(value: number) {
        this.buffer.writeInt16LE(value, this.inc(2));
    };

    writeInt32(value: number) {
        this.buffer.writeInt32LE(value, this.inc(4));
    };

    writeInt64(value: number | bigint) {
        this.buffer.writeBigInt64LE(BigInt(value), this.inc(8));
    };

    writeFloat32(value: number) {
        this.buffer.writeFloatLE(value, this.inc(4));
    };

    writeFloat64(value: number) {
        this.buffer.writeDoubleLE(value, this.inc(8));
    };

    write(text: string, length = Buffer.byteLength(text)) {
        this.buffer.write(text, this.inc(length));
    };

    writeBuffer(buffer: Buffer) {
        buffer.copy(this.buffer, this.inc(buffer.length));
    };

    getBuffer() {
        return this.buffer.subarray(this.index);
    };

    toString(encoding: BufferEncoding, length: number) {
        return this.buffer.toString(encoding, this.index, this.index += length);
    };
}