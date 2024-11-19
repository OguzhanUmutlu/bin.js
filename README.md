# Stramp

A JavaScript library that can convert any kind of data into binary that can be restored.

# Installation

```bash
npm install stramp
```

# Importing

I will be importing the library as `X` in the examples below.

```js
import X from "stramp";
```

# Example usage

```js
const myValue = 5716282;

const buffer = X.serialize(myValue);

console.log(buffer); // <Buffer 0a 3a 39 57 00>

const restoredValue = X.deserialize(buffer);

console.log(restoredValue); // 5716282
```

## What is a Stramp Bin?

A Binary Data Converter is a class that can convert a specific kind of data into a sequences of bytes
and is able to convert that sequence of bytes back into the same data it was given. It is a both-ways
lossless conversion. **We will be referring to them as 'Bin's throughout this Readme file and the code itself.**

## Defaults

Stramp comes with the following default types:

* `u8`
* `u16`
* `u32`
* `u64`
* `i8`
* `i16`
* `i32`
* `i64`
* `f32`: Not recommended as its low precision, JavaScript uses `f64` by default
* `f64`
* `ubigint`
* `bigint`
* `string8`
* `string16`
* `string32`
* `cstring`: Null terminated string
* `bool`
* `array`: Can hold any of these types, check out [ArrayBin](#array-bin)
* `set`: Has every feature an array has
* `arrayBuffer`: u8 typed array, but writes and reads an ArrayBuffer object
* `buffer`: u8 typed array, but writes and reads a Buffer object
* `u8array`
* `u8clampedArray`
* `u16array`
* `u32array`
* `u64array`
* `i8array`
* `i16array`
* `i32array`
* `i64array`
* `f32array`
* `f64array`
* `object`: Can hold any of these types, check out [ObjectBin](#object-bin)
* `map`: Holds key-value pairs that can be any of these types
* `class`: Can hold class instances if the class has been registered in it
* `date`
* `regexp`
* `any`
* `ignore`: Writes nothing no matter what, reads undefined
* `null`
* `undefined`
* `true`
* `false`
* `zero`
* `bigZero`
* `NaN`
* `inf`
* `negInf`

## A comprehensive example

```js
const obj = {
    name: "John Doe",
    age: 42,
    address: {
        street: "123 Main St",
        city: "Anytown",
        state: "CA",
        zip: "12345"
    },
    phoneNumbers: [1234567890, 9876543210],
    pets: ["cat", "dog"],
    favoriteColors: ["red", "blue", "green"],
    isMarried: true,
    children: null,
    spouse: undefined,
    favoriteNumber: 3.14159,
    favoriteMathConstant: Math.PI,
    favoriteArray: [1, "Apple Pie", true, null, undefined, 258724n, 3.14159, Math.PI]
};

const buffer = X.serialize(obj);

console.log(buffer); // <Buffer 2c 0c 04 6e 61 6d 65 29 08 4a 6f 68 6e 20 44 ... 308 more bytes>
// This saved us 67 bytes compared to JSON! (Will save more than 3 times when using structs)

const restoredObj = X.deserialize(buffer);

console.log(restoredObj); // Will have the same values as obj
```

## Array Bin

### Default array

The default array can hold any amount of anything.

Example:

```js
const myArray = [1, "Apple Pie", true, null, undefined, 258724n, 3.14159, Math.PI];

const buffer = X.serialize(myArray);

// First byte indicates that it's an array
// 2-5 bytes indicate the length of the array as a u32
// The rest of the bytes are the array's values with their types as a single byte in front
console.log(buffer); // <Buffer 17 08 00 00 00 0c 01 29 09 41 70 70 6c 65 20 50 69 65 14 10 11 09 a4 f2 03 00 00 00 00 00 03 6e 86 1b f0 f9 21 09 40 03 18 2d 44 54 fb 21 09 40>

const restoredArray = X.deserialize(buffer);

console.log(restoredArray); // Will have the same values as myArray
```

### Typed dynamic sized arrays

```js
const myType = X.array.typed(X.u8);

const myArray = [5, 3, 1, 2, 4];

const buffer = myType.serialize(myArray);

// First 4 bytes are the size of the array as a u32
// The rest of the bytes are the array's values
console.log(buffer); // <Buffer 05 00 00 00 05 03 01 02 04>

const restoredArray = myType.deserialize(buffer);

console.log(restoredArray); // [5, 3, 1, 2, 4]

// You can change the array's length's bytes using this:
const myNewType = myType.lengthBytes(X.u8); // Uses 1 byte for the length
```

### Single typed fixed sized arrays

```js
const myType = X.array.typed(X.u8).sized(5);

const myArray = [5, 3, 1, 2, 4];

const buffer = myType.serialize(myArray);

console.log(buffer); // <Buffer 05 03 01 02 04>

const restoredArray = myType.deserialize(buffer);

console.log(restoredArray); // [5, 3, 1, 2, 4]
```

### Array structs

```js
const myStruct = X.array.struct([X.u8, X.string8, X.null]);

const myArray = [5, "Hello", null];

const buffer = myStruct.serialize(myArray);

// 1st byte: The first element in the array
// 2nd byte: Length of the string
// 3-7th bytes: The string
// Notice that it doesn't store the null, because it already knows it has to be there.
console.log(buffer); // <Buffer 05 05 48 65 6c 6c 6f>

const restoredArray = myStruct.deserialize(buffer);

console.log(restoredArray); // [5, "Hello", null]
```

## Object Bin

### Default object

```js
const myObject = {
    name: "John Doe",
    age: 30,
    ageBig: 30n
};

const buffer = X.serialize(myObject);

console.log(buffer); // <Buffer 2c 03 00 00 00 04 00 00 00 6e 61 6d 65 29 08 4a 6f 68 6e 20 44 6f 65 03 00 00 00 61 67 65 0c 1e 06 00 00 00 61 67 65 42 69 67 0c 1e>

const restoredObject = X.deserialize(buffer);

console.log(restoredObject); // Will have the same values as myObject
```

### Typed dynamic sized objects

```js
// Note that the keyTyped only accepts a string bin
const myType = X.object.keyTyped(X.string8).valueTyped(X.u8);

const myObject = {
    name: "John Doe",
    age: 30,
    ageBig: 30n
};

const buffer = myType.serialize(myObject);

console.log(buffer); // <Buffer 2c 03 00 00 00 04 00 00 00 6e 61 6d 65 29 08 4a 6f 68 6e 20 44 6f 65 03 00 00 00 61 67 65 0c 1e 06 00 00 00 61 67 65 42 69 67 0c 1e>

const restoredObject = myType.deserialize(buffer);

console.log(restoredObject); // Will have the same values as myObject
```

### Object structs

```js
const myType = X.object.struct({
    age: X.u8,
    name: X.string8,
    numbers: X.array.typed(X.u8).sized(5)
});

const myObject = {
    age: 30,
    name: "John Doe",
    numbers: [1, 2, 3, 4, 5]
};

const buffer = myType.serialize(myObject);

// First byte is the age
// Second byte is the length of the name
// 3-7th bytes is the name
// 8-12th bytes are the numbers array
console.log(buffer); // <Buffer 1e 08 4a 6f 68 6e 20 44 6f 65 01 02 03 04 05>
// This drops 50 bytes of JSON down to 15 bytes! Meaning 1000 of this object would gain
// you 35000 bytes.

const restoredObject = myType.deserialize(buffer);

console.log(restoredObject); // Will have the same values as myObject
```

## Using classes

The simple way:

```js
class Vector {
    x = 0.1;
    y = 0.1;
}

X.class.add(Vector);

const myVector = new Vector();

const buffer = X.serialize(myVector);

console.log(buffer); // <Buffer 2f 00 02 00 00 00 01 00 00 00 78 03 9a 99 99 99 99 99 b9 3f 01 00 00 00 79 03 9a 99 99 99 99 99 b9 3f>
// The result is too long though as it doesn't know the types of the properties.

const restoredVector = X.deserialize(buffer);

console.log(restoredVector); // Will have the same values as myVector
```

The memory-efficient way:

```js
class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    };
}

const VectorType = X.object
    .struct({x: X.f64, y: X.f64})
    .withConstructor(obj => new Vector(obj.x, obj.y));

const myVector = new Vector(6346.5213, 5123.1236);

const buffer = VectorType.serialize(myVector);

console.log(buffer); // <Buffer 68 b3 ea 73 85 ca b8 40 c9 e5 3f a4 1f 03 b4 40>
// This small change of using a struct reduces the byte size to only 16 bytes! (8 bytes per number because f64 has 64 bits)

const restoredVector = VectorType.deserialize(buffer);

console.log(restoredVector); // Vector { x: 6346.5213, y: 5123.1236 }
```

## The limitations

Stramp cannot convert symbols, functions or class instances unless you have manually introduced them
to their respective Bins.

Here's an example on runtime values:

```js
function A() {
}

function B() {
}

class C {
}

// Note that the order is important
// If you were to serialize it, change the order of these values,
// the deserialized value will be different and may even be corrupted
const myBin = X.any.ofValues(A, B, C);

const buffer = myBin.serialize(A); // <Buffer 00>

const restoredValue = myBin.deserialize(buffer); // A

console.log(restoredValue === A); // true
```