import X from "../dist/index.js";

class Vector {
    x = 0.1;
    y = 0.1;
}

X.class.add(Vector);

const myVector = new Vector();

const buffer = X.serialize(myVector);

console.log(buffer); // <Buffer 2f 00 02 00 00 00 01 00 00 00 78 03 9a 99 99 99 99 99 b9 3f 01 00 00 00 79 03 9a 99 99 99 99 99 b9 3f>

const restoredVector = X.deserialize(buffer);

console.log(restoredVector); // Will have the same values as myVector