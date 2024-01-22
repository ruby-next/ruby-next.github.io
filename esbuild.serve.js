import esbuild from "esbuild";
import url from "url";
import wasmPlugin from "./.esbuild/wasmPlugin.js";
import copyPlugin from "./.esbuild/copyPlugin.js";

const entryPoint = url.fileURLToPath(new URL("./src/index", import.meta.url));
const outdir = url.fileURLToPath(new URL("./dist", import.meta.url));
const srcDir = url.fileURLToPath(new URL("./src", import.meta.url));

const ctx = await esbuild.context({
  bundle: true,
  entryPoints: [entryPoint],
  format: "esm",
  outdir,
  plugins: [
    wasmPlugin,
    copyPlugin({
      src: srcDir,
      dest: outdir,
      patterns: ["*.html", "assets/**/*"],
    }),
  ],
  sourcemap: true,
  splitting: true,
  target: "esnext",
  loader: {
    ".ttf": "file",
  },
});

const { host, port } = await ctx.serve({ servedir: outdir });
console.log(`Listening at ${host}:${port}`);
