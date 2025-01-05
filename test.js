import { renderCode, browser } from "./src/code_renderer.js";
import fs from "node:fs";

const code = `      logger.info(\`Update deferred, rendering code\`);
      image = await renderCode({
        language: settingsState.language,
        code: codeSnippet,
        theme: settingsState.theme,theme: settingsState.theme,theme: settingsState.theme,theme: settingsState.theme,
      });
      logger.info(\`Code rendered, updating modalResponse\`);`;
const image = await renderCode({ language: "js", code, theme: "dracula" });
fs.writeFileSync("test.png", image);
browser.close();
