import X from "../src/Stramp";

const B = X.array.struct([
    X.u8,
    X.string8,
    X.bool,
    X.array.typed(X.u8).lengthBytes(X.u8)
]);

console.log(B.serialize([5, "A", true, [5, 6, 7, 8, 9]]));