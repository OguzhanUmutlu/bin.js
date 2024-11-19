import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";
import nodeResolve from "@rollup/plugin-node-resolve";
import {defineConfig} from "rollup";

export default defineConfig({
    input: "dist/ts/Stramp.js",
    output: [
        {
            file: "dist/index.js",
            format: "esm"
        },
        {
            file: "dist/index.min.js",
            format: "esm",
            plugins: [terser()]
        }
    ],
    plugins: [
        nodeResolve({preferBuiltins: false}),
        commonjs()
    ]
});