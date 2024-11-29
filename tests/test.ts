import X from "../src/Stramp";

const buf = X.string16.serialize("§a");

console.log(Buffer.from("§a"));

console.log(buf);

console.log(X.string16.deserialize(buf));