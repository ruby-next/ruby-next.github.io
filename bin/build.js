import esbuild from "esbuild";
import url from "url";
import wasmPlugin from "./wasmPlugin.js";
import copyPlugin from "./copyPlugin.js";

const entryPoint = url.fileURLToPath(new URL("../src/index", import.meta.url));
const outdir = url.fileURLToPath(new URL("../dist", import.meta.url));

const { metafile } = await esbuild.build({
  bundle: true,
  entryPoints: [entryPoint],
  format: "esm",
  metafile: true,
  minify: true,
  outdir,
  plugins: [wasmPlugin, copyPlugin],
  sourcemap: true,
  splitting: true,
  target: "es6",
});

const analysis = await esbuild.analyzeMetafile(metafile);
console.log(analysis);
