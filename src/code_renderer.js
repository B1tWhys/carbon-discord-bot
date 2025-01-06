// File: generate-html.mjs
import { ExpressiveCode, ExpressiveCodeTheme } from "expressive-code";
import { toHtml } from "expressive-code/hast";
import { bundledThemes, bundledThemesInfo } from "shiki/themes.mjs";
import puppeteer from "puppeteer";
import { logger } from "./logging";

export const themes = bundledThemesInfo;

export const browser = await puppeteer.launch({
  headless: true,
  defaultViewport: { width: 1000, height: 1200, deviceScaleFactor: 2 },
});

process.on("SIGTERM", async () => {
  logger.info("SIGTERM signal received.");
  await browser.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.info("SIGINT signal received.");
  await browser.close();
  process.exit(0);
});

async function helper({
  page,
  language,
  code,
  theme,
  windowMode,
  title,
  margin,
}) {
  console.log(`Title: ${title}`);
  const ec = new ExpressiveCode({
    themes: [new ExpressiveCodeTheme((await bundledThemes[theme]()).default)],
    useDarkModeMediaQuery: false,
    frames: {
      showCopyToClipboardButton: false,
    },
  });

  // Get base styles that should be included on the page
  // (they are independent of the rendered code blocks)
  const baseStyles = await ec.getBaseStyles();
  const themeStyles = await ec.getThemeStyles();
  const jsModules = await ec.getJsModules();

  // Render some example code to AST
  const { renderedGroupAst, styles: blockStyles } = await ec.render({
    code: code,
    language: language,
    props: {
      wrap: true,
      frame: windowMode,
      title: title,
      showCopyToClipboardButton: false,
    },
  });

  // Convert the rendered AST to HTML
  let htmlContent = toHtml(renderedGroupAst);

  // Collect styles and add them before the HTML content
  const stylesToPrepend = [];
  stylesToPrepend.push(baseStyles);
  stylesToPrepend.push(themeStyles);
  stylesToPrepend.push(...blockStyles);

  const styleContent = `<style> ${[...stylesToPrepend].join("")} </style>`;
  const jsContent = `<script type="module"> ${[...jsModules].join("")} </script>`;

  const htmlDocument = `
<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>

    ${styleContent}
    <style>
      body {
        max-width: 1000px;
        width: fit-content;
        padding: ${margin};
        background: radial-gradient(circle, rgba(2,0,36,1) 0%, rgba(9,9,121,1) 55%, rgba(0,212,255,1) 100%); 
      }
    </style>

    ${jsContent}

</head>
<body>
    ${htmlContent}
</body>
</html>
`;

  await page.setContent(htmlDocument);
  const element = await page.waitForSelector("body");
  const image = Buffer.from(
    await element.screenshot({
      type: "png",
    }),
  );

  return image;
}

export async function renderCode(args) {
  let context, page;
  try {
    context = await browser.createBrowserContext();
    page = await context.newPage();
    return await helper({ page, ...args });
  } finally {
    if (context !== undefined) {
      await context.close();
    }
  }
}
