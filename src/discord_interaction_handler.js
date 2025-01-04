import {
  ActionRowBuilder,
  ModalBuilder,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle,
  ButtonBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  MessageFlags,
} from "discord.js";
import { renderCode, themes } from "./code_renderer.js";
import { bundledLanguages } from "shiki";

export const data = new SlashCommandBuilder()
  .setName("carbon")
  .setDescription("Generate a beautiful code snippet.")
  .addStringOption((option) =>
    option
      .setName("language")
      .setDescription("The programming language of the code snippet.")
      .setRequired(true),
  );

async function getCodeSnippetViaModel(interaction) {
  const modal = new ModalBuilder()
    .setCustomId("code-snippet")
    .setTitle("Code snippet")
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("code")
          .setLabel("Code")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true),
      ),
    );

  console.log("Displaying the modal");
  await interaction.showModal(modal);

  const collectorFilter = (i) =>
    i.isModalSubmit() &&
    i.user.id === interaction.user.id &&
    i.customId === "code-snippet";
  console.log("Waiting for modal submit");
  const confirmation = await interaction.awaitModalSubmit({
    filter: collectorFilter,
    time: 60000,
  });

  const codeSnippet = confirmation.fields.getTextInputValue("code");
  return [confirmation, codeSnippet];
}

function buildConfigurationMessageComponents({
  currentThemeName,
  currentWindowMode,
}) {
  return [
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("theme")
        .setLabel("Theme")
        .addOptions(
          themes.slice(0, 20).map((theme) =>
            new StringSelectMenuOptionBuilder()
              .setLabel(theme.displayName)
              .setValue(theme.id)
              .setDefault(theme.id == currentThemeName),
          ),
        ),
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("cancel")
        .setLabel("Cancel")
        .setStyle("Danger"),
      new ButtonBuilder()
        .setCustomId("confirm")
        .setLabel("Confirm")
        .setStyle("Primary"),
    ),
  ];
}

export async function execute(interaction) {
  if (!interaction.isChatInputCommand()) return;

  let settingsState = {
    theme: "dracula",
    windowMode: "terminal",
    language: interaction.options.getString("language"),
  };

  let [modalResponse, codeSnippet] = await getCodeSnippetViaModel(interaction);
  await modalResponse.deferReply({ flags: MessageFlags.Ephemeral });
  let image = await renderCode({
    language: settingsState.language,
    code: codeSnippet,
    theme: settingsState.theme,
  });

  let configInteraction = await modalResponse.editReply({
    files: [image],
    components: buildConfigurationMessageComponents({
      currentThemeName: theme,
      currentWindowMode: windowMode,
    }),
    flags: MessageFlags.Ephemeral,
  });

  const filter = (i) => i.user.id === interaction.user.id;
  while (true) {
    configInteraction = await configInteraction.awaitMessageComponent({
      filter,
      time: 60000,
    });

    const interactionId = configInteraction.customId;
    if (interactionId === "cancel") {
      await modalResponse.deleteReply();
      break;
    } else if (interactionId === "confirm") {
      await configInteraction.reply({
        files: [image],
      });
      break;
    } else if (interactionId === "theme") {
      theme = configInteraction.values[0];
      console.log(`User changed theme to: ${theme}`);
      image = await renderCode(lang, codeSnippet, theme);
      configInteraction = await configInteraction.update({
        files: [image],
        components: buildConfigurationMessageComponents(theme),
      });
    } else if (interactionId === "window-mode") {
      windowMode = configInteraction.values[0];
      console.log(`User changed window mode to: ${windowMode}`);
      image = await renderCode(lang, codeSnippet, theme);
      configInteraction = await configInteraction.update({
        files: [image],
        components: buildConfigurationMessageComponents(theme),
      });
    }
  }
}
