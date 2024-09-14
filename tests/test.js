const BinJS = require("../index");

class Vec2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

const Vec2Struct = BinJS.object.struct({
    x: BinJS.u8,
    y: BinJS.u8
}).class(Vec2, ({x, y}) => new Vec2(x, y));

const myVec = new Vec2(10, 20);

const buf = Vec2Struct.serialize(myVec);

console.log(buf);

console.log(Vec2Struct.deserialize(buf));