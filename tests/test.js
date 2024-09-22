const BinJS = require("../index");
const fs = require("fs/promises");

const asyncBin = BinJS.makeBin({
    name: "myAsyncBin",
    async write(buffer, index) {
        buffer[index[0]++] = (await fs.readFile("./test.js"))[0];
    },
    read(buffer, index) {
        return buffer[index[0]++];
    },
    size: () => 1,
    validate: () => null,
    sample: () => 0
});

(async () => {
    const buf = await asyncBin.serialize();
    console.log(buf);
    console.log(asyncBin.deserialize(buf));
})();