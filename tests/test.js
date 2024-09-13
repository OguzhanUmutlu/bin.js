const BinJS = require("../index");

const Vec2 = BinJS.object.struct({
    x: BinJS.f32,
    y: BinJS.f32
});

const myVec = new Vec2;

console.log(myVec.x);

const buf = myVec.buffer;

buf[2] = 30;
buf[3] = 65;

myVec.buffer = buf;

console.log(myVec.x);