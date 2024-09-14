const BinJS = require("../index");

const U8ArrayWith10Numbers = BinJS.u8array.fixed(10)

const buf = U8ArrayWith10Numbers.serialize(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]))

console.log(buf) // <Buffer 01 02 03 04 05 06 07 08 09 0a>

console.log(U8ArrayWith10Numbers.deserialize(buf)) // Uint8Array [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ]