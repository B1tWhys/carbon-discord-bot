import { renderCode } from "./commands/render_code.js";
import fs from "node:fs";

const code = 'console.log("Hello world!")';
const image = await renderCode(code);
fs.writeFileSync("test.png", image);
