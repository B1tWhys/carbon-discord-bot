import {
  ActionRowBuilder,
  ModalBuilder,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { renderCode } from "./code_renderer.js";

export const data = new SlashCommandBuilder()
  .setName("carbon")
  .setDescription("Generate a beautiful code snippet.")
  .addStringOption((option) =>
    option
      .setName("language")
      .setDescription("The programming language of the code snippet.")
      .setRequired(true),
  );

export async function execute(interaction) {
  if (!interaction.isChatInputCommand()) return;

  const lang = interaction.options.getString("language");
  const form = new ActionRowBuilder().addComponents(
    new TextInputBuilder()
      .setCustomId("code")
      .setLabel("Code")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true),
  );

  const modal = new ModalBuilder()
    .setCustomId("code-snippet")
    .setTitle("Code snippet")
    .addComponents(form);

  console.log("Displaying the modal");
  await interaction.showModal(modal);

  const collectorFilter = (i) => i.user.id === interaction.user.id;
  console.log("Waiting for modal submit");
  const confirmation = await interaction.awaitModalSubmit({
    filter: collectorFilter,
    time: 60000,
  });

  console.log("modal confirmed");
  confirmation.reply(
    `Language was: ${lang} and code snippet was: ${confirmation.fields.getTextInputValue("code")}`,
  );
}
