const B = require("../index");

const x = 314159265358979323846264338327950288419716939937510582097494459230781640628620899862803482534211706n;

const buf = B.serialize(x);

console.log(buf, buf.length);

console.log(B.deserialize(buf));