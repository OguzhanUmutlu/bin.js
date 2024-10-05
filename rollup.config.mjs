import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

export default {
    input: "index.js",
    output: [
        {
            file: "dist/index.cjs.js",
            format: "cjs",
            exports: "auto"
        },
        {
            file: "dist/index.esm.js",
            format: "esm"
        }
    ],
    plugins: [
        nodeResolve({
            preferBuiltins: false
        }),
        commonjs()
    ]
};