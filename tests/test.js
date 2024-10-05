const {default: {object, i8, f64, string, array, u8array}} = require("../index");

const MyStruct = object.struct({
    x: i8,
    y: f64,
    z: string,
    t: {
        a: i8,
        b: [string, i8]
    }
});

const data = {
    x: 10,
    y: 5284.25,
    z: "hello, world!",
    t: {
        a: 20,
        b: ["hello, again!", 125]
    }
};

const buf = MyStruct.serialize(data);
console.log(buf); // <Buffer>
console.log(MyStruct.deserialize(buf));  // data

const type = u8array.fixed(20).array(10);

console.log(type.serialize(Array(10).fill(new Uint8Array(Array(20)))));