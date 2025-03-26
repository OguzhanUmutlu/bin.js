import X from "../src/Stramp";

const b = X.object.keyTyped(X.u8).valueTyped(X.u8);

console.log(b.deserialize(b.serialize({
    1: 10,
    7: 50
})));