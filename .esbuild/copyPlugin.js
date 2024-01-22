import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import * as glob from "glob";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default function copyPlugin({ src, dest, patterns }) {
  return {
    name: "copy",
    setup(build) {
      build.onEnd(() => {
        const sourceDir = path.resolve(__dirname, src);
        const destDir = path.resolve(__dirname, dest);
        patterns.forEach((pattern) => {
          const srcFiles = glob.sync(path.resolve(sourceDir, pattern));
          srcFiles.forEach((srcFile) => {
            const relSrcFile = path.relative(sourceDir, srcFile);
            const destFile = path.resolve(destDir, relSrcFile);
            console.log(`Copying ${srcFile} to ${destFile}`);
            fs.mkdirSync(path.dirname(destFile), { recursive: true });
            fs.copyFileSync(srcFile, destFile);
          });
        });
      });
    },
  };
}
