import BinJS from "../index.mjs";

const buf = BinJS.serialize(5);
console.log(buf);
console.log(JSON.stringify(buf.toString()));
console.log(BinJS.deserialize(buf));