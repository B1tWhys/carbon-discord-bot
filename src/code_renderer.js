// File: generate-html.mjs
import { ExpressiveCode, ExpressiveCodeTheme } from "expressive-code";
import { toHtml } from "expressive-code/hast";
import nodeHtmlToImage from "node-html-to-image";
import { bundledThemes, bundledThemesInfo } from "shiki/themes.mjs";

export const themes = bundledThemesInfo;

export async function renderCode({ language, code, theme }) {
  const ec = new ExpressiveCode({
    themes: [new ExpressiveCodeTheme((await bundledThemes[theme]()).default)],
    useDarkModeMediaQuery: false,
    wrap: true,
  });

  // Get base styles that should be included on the page
  // (they are independent of the rendered code blocks)
  const baseStyles = await ec.getBaseStyles();
  const themeStyles = await ec.getThemeStyles();
  const jsModules = await ec.getJsModules();

  // Render some example code to AST
  const { renderedGroupAst, styles: blockStyles } = await ec.render({
    code: code,
    // language: language,
    wrap: true,
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
        max-width: 500px;
      }
    </style>

    ${jsContent}

</head>
<body>
    ${htmlContent}
</body>
</html>
`;

  const image = await nodeHtmlToImage({
    html: htmlDocument,
    puppeteerArgs: {
      defaultViewport: {
        width: 500,
        height: 1200,
        deviceScaleFactor: 2,
      },
    },
  });

  return image;
}
