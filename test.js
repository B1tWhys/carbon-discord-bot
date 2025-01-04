import { renderCode, browser } from "./src/code_renderer.js";
import fs from "node:fs";

const code = 'console.log("Hello world!")';
const image = await renderCode({ language: "js", code, theme: "dracula" });
fs.writeFileSync("test.png", image);
browser.close();
