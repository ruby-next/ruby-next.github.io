import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
  name: "copy",
  setup(build) {
    build.onEnd(() => {
      fs.copyFileSync(
        path.resolve(__dirname, "../src/index.html"),
        path.resolve(__dirname, "../dist/index.html")
      );
    });
  },
};
