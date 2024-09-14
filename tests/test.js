const B = require("../index");

class Vector {
    constructor(x, y) {
        this.x = x
        this.y = y
    }
}

const VectorStruct = B.object.structClass(new Vector(-1000, -1000)) // And that's it!
// This will do this: BinJS.object.struct({ x: i16, y: i16 }).class(Vector)
// The con: The types of the properties are minimally selected. Like if it was 1000,1000 it would have gone with u16 instead of i16.

const myVec = new Vector(10, 20)

const buf = VectorStruct.serialize(myVec)

console.log(buf) // <Buffer 0a 14>

console.log(VectorStruct.deserialize(buf)) // Vector { x: 10, y: 20 }