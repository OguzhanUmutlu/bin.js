const BinJS = require("../dist/index.js");

class MyClass {
}

const myInstance = new MyClass();
myInstance.a = 10;
myInstance.b = "hello, world!";
myInstance.c = {x: 50, y: 100};

BinJS.setOptions({
    classes: [MyClass]
})

const buf = BinJS.serialize(myInstance);
console.log(buf, buf.length);
console.log(BinJS.deserialize(buf));