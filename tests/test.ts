import X from "../src/Stramp";

const o = X.object.struct({
    a: X.u8,
    b: X.u16,
    c: X.u32
});

const c = o.structData;

const b = o.excludeKeys("a", "b");

console.log(b.serialize({c: 10}))