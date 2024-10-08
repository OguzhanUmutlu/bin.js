# JSBinary

A JavaScript library that can convert any kind of data into binary that can be restored

# Installation

```bash
npm install stramp
```

# Usage

```js
const BinJS = require("stramp")
// or
import BinJS from "stramp"

const buf = BinJS.serialize(10)

console.log(buf) // <Buffer 0a 0a>

console.log(BinJS.deserialize(buf)) // 10
```

## Storing complex objects

```js
import BinJS from "stramp"

const obj = {
    a: 10,
    b: "hello, world!",
    c: {x: 50, y: 100}
}

const buf = BinJS.serialize(obj)

console.log(buf) // <Buffer 26 61 00 0a 0a 62 00 14 0d 68 65 6c 6c 6f 2c 20 77 6f 72 6c 64 21 63 00 26 78 00 0a 32 79 00 0a 64 01 01>

console.log(BinJS.deserialize(buf)) // { a: 10, b: 'hello, world!', c: { x: 50, y: 100 } }
```

## Using built-in arrays with fixed length

This gains 2 bytes in the output buffer size, and it cannot be further shortened.

```js
import BinJS from "stramp"

const U8ArrayWith10Numbers = BinJS.u8array.fixed(10)

const buf = U8ArrayWith10Numbers.serialize(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]))

console.log(buf) // <Buffer 01 02 03 04 05 06 07 08 09 0a>

console.log(U8ArrayWith10Numbers.deserialize(buf)) // Uint8Array [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ]
```

## Structured and typed arrays/objects

```js
import BinJS from "stramp"
const {string, u8, u16, object, array} = BinJS

const Person = object.struct({
    name: string,
    age: u8,
    height: u16
})

// creates a dynamically sized array that includes Person struct
const People = array.typed(Person)
// Max length of the array is 2^16 = 65536, you can change it like this:
// const people = array.typed(person, null, 4)
// The second argument indicates the length of the array, null means it can be anything.
// This will use 4 bytes, resulting with a u32 int, 2^32 = 4294967295
// Length bytes options: 1, 2, 4, 8

const buf = People.serialize([
    {name: "John", age: 30, height: 180},
    {name: "Jane", age: 25, height: 165}
])

console.log(buf) // <Buffer 02 00 1e b4 00 4a 6f 68 6e 00 19 a5 00 4a 61 6e 65 00 01>
// Readable version: [2, 0, 30, 180, 0, J, o, h, n, 0, 25, 165, 0, J, a, n, e, 0, 1]
// The first two bytes indicate the number of elements in the array as u16.
// There is a 0 after 180 and 165 because it's a u16.
// The 0 after the strings indicates the end of the string.
// The 1 in the end indicates the end of the array.

console.log(People.deserialize(buf))
// [
//   { age: 30, height: 180, name: 'John' },
//   { age: 25, height: 165, name: 'Jane' }
// ]

const myPerson = new Person()
myPerson.name = "John"
myPerson.age = 30
myPerson.height = 180

const buf2 = myPerson.buffer // It's that easy! No need to use .serialize() or .deserialize()

buf2[5] = 40 // Change something random

myPerson.buffer = buf2 // Load it back

console.log(myPerson) // Struct { age: 30, height: 180, name: 'Jo(n' }
// Apparently we changed the name to 'Jo(n'

class Vector {
    constructor(x, y) {
        this.x = x
        this.y = y
    }
}

const VectorStruct = object.struct({
    x: u8,
    y: u8
}).class(Vector, ({x, y}) => new Vector(x, y))

const myVec = new Vector(10, 20)

const buf = VectorStruct.serialize(myVec)

console.log(buf) // <Buffer 0a 14>

console.log(VectorStruct.deserialize(buf)) // Vector { x: 10, y: 20 }
```

## Using object.structClass()

```js
import BinJS from "stramp"

class Vector {
    constructor(x, y) {
        this.x = x
        this.y = y
    }
}

const VectorStruct = BinJS.object.structClass(new Vector(-1000, -1000)) // And that's it!
// This will do this: BinJS.object.struct({ x: i16, y: i16 }).class(Vector)
// The drawback: The types of the properties are minimally selected. Like if it was 1000,1000 it would have gone with u16 instead of i16.

const myVec = new Vector(10, 20)

const buf = VectorStruct.serialize(myVec)

console.log(buf) // <Buffer 0a 00 14 00>

console.log(VectorStruct.deserialize(buf)) // Vector { x: 10, y: 20 }
```

## Storing classes

```js
import BinJS from "stramp"

class MyClass {
}

const myInstance = new MyClass()
myInstance.a = 10
myInstance.b = "hello, world!"
myInstance.c = {x: 50, y: 100}

BinJS.setOptions({
    // if order of the classes changes, the output will be different
    // you can add new classes to the end of the list
    classes: [MyClass]
})

const buf = BinJS.serialize(myInstance)

console.log(buf) // <Buffer 29 00 00 61 00 0a 0a 62 00 14 0d 68 65 6c 6c 6f 2c 20 77 6f 72 6c 64 21 63 00 26 78 00 0a 32 79 00 0a 64 01 01>

console.log(BinJS.deserialize(buf)) // MyClass { a: 10, b: 'hello, world!', c: { x: 50, y: 100 } }
```

## Storing classes using object.class()

```js
import BinJS from "stramp"

class MyClass {
}

const x = new MyClass()
x.a = 10
x.b = "hello, world!"

const myClassType = BinJS.object.class(MyClass)

const buf = myClassType.serialize(x)

console.log(buf) // <Buffer 61 00 0a 0a 62 00 14 0d 68 65 6c 6c 6f 2c 20 77 6f 72 6c 64 21 01>

console.log(myClassType.deserialize(buf)) // MyClass { a: 10, b: 'hello, world!' }
```

## Using any.of()

```js
import BinJS from "stramp"

const i8OrString = BinJS.any.of(BinJS.i8, BinJS.string)

console.log(i8OrString.serialize(10)) // <Buffer 00 8a>
console.log(i8OrString.serialize("hello")) // <Buffer 01 68 65 6c 6c 6f 00>


const myAnyOf = BinJS.any.of("hello", 10, true, BinJS.bigint)

console.log(myAnyOf.serialize("hello")) // <Buffer 00>
console.log(myAnyOf.serialize(10)) // <Buffer 01>
console.log(myAnyOf.serialize(true)) // <Buffer 02>
console.log(myAnyOf.serialize(10n)) // <Buffer 03 00 01 00 0a>
```

## Making asynchronous binaries

```js
import BinJS from "stramp"
const fs = require("fs/promises")

const asyncBin = BinJS.makeBin({
    name: "myAsyncBin",
    async write(buffer, index, filename) {
        // Reads the first character of the file
        // and stores it in the buffer
        buffer[index[0]++] = (await fs.readFile(filename))[0]
    },
    read(buffer, index) {
        // Reads the written character
        return buffer[index[0]++]
    },
    size: () => 1, // 1 byte
    validate: () => null, // no validation
    sample: () => 0 // 0 as a sample
})

(async () => {
    const buf = await asyncBin.serialize("./myFile.txt")
    console.log(buf) // <Buffer 63>
    console.log(asyncBin.deserialize(buf)) // 99
})()
```

## Storing functions/constants/runtime values

```js
import BinJS from "stramp"

function myFunc() {
    return 10
}

const myObj = {x: 10}

BinJS.setOptions({
    // if order of the constantList changes, the output will be different
    // you can add new functions/constants to the end of the list
    constantList: [myFunc, myObj]
})

const buf = BinJS.serialize([myFunc, myObj])

console.log(buf) // <Buffer 18 2a 00 00 26 78 00 0a 0a 01 01>

const [fn, obj] = BinJS.deserialize(buf)
console.log(fn) // [Function: myFunc]
console.log(fn === myFunc) // true
console.log(obj) // { x: 10 }
console.log(myObj === obj) // true
```

## Storing JavaScript supported class instances

```js
import BinJS from "stramp"

const date = new Date()
const arr = new Uint16Array([1, 2, 3])
const set = new Set([1, 2, 3])
const map = new Map([[1, 2], [3, 4]])

const buf = BinJS.serialize({date, arr, set, map})

console.log(buf) // <Buffer 26 64 61 74 65 00 28 58 a3 a3 e1 91 01 00 00 61 72 72 00 1c 0a 01 0a 02 0a 03 01 73 65 74 00 19 0a 01 0a 02 0a 03 01 6d 61 70 00 27 0a 01 0a 02 0a 03 ... 4 more bytes>

console.log(BinJS.deserialize(buf)) // { date: 2024-09-14T07:37:04.402Z, arr: Uint16Array(3) [ 1, 2, 3 ], set: Set(3) { 1, 2, 3 }, map: Map(2) { 1 => 2, 3 => 4 } }
```