const BinJS = require("../index");

const i8OrString = BinJS.any.of(BinJS.i8, BinJS.string)

console.log(i8OrString.serialize(10)) // <Buffer 00 8a>
console.log(i8OrString.serialize("hello")) // <Buffer 01 68 65 6c 6c 6f 00>


const myAnyOf = BinJS.any.of("hello", 10, true, BinJS.bigint)

console.log(myAnyOf.serialize("hello")) // <Buffer 00>
console.log(myAnyOf.serialize(10)) // <Buffer 01>
console.log(myAnyOf.serialize(true)) // <Buffer 02>
console.log(myAnyOf.serialize(10n)) // <Buffer 03 00 01 00 0a>