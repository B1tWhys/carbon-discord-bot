import { SlashCommandBuilder } from "discord.js";
import { renderCode } from "./code_renderer.js";

export const data = new SlashCommandBuilder()
  .setName("carbon")
  .setDescription("Generate a beautiful code snippet.");

export async function execute(interaction) {
  const code = interaction.options.getString("code");
  const image = await renderCode(code);
  console.log(image);
  await interaction.reply({ files: [image] });
}
