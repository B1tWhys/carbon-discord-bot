import { renderCode } from "./src/code_renderer.js";
import fs from "node:fs";

const code = 'console.log("Hello world!")';
const image = await renderCode(code);
fs.writeFileSync("test.png", image);
