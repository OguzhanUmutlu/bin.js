const {default: {set, object, i8, f64, string, bigint, _id}} = require("../index");

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

console.log(buf);

console.log(MyStruct.deserialize(buf));