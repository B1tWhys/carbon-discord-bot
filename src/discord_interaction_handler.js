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
import loggerBuilder from "pino";

const logger = loggerBuilder();

const TIMEOUT = 60000;

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
          .setCustomId("title")
          .setLabel("Title")
          .setStyle(TextInputStyle.Short)
          .setMaxLength(32)
          .setRequired(false),
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("code")
          .setLabel("Code")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true),
      ),
    );

  logger.info("Displaying the modal");
  await interaction.showModal(modal);

  const collectorFilter = (i) =>
    i.isModalSubmit() &&
    i.user.id === interaction.user.id &&
    i.customId === "code-snippet";
  logger.info("Waiting for modal submit");
  const confirmation = await interaction.awaitModalSubmit({
    filter: collectorFilter,
    time: TIMEOUT,
  });

  const title = confirmation.fields.getTextInputValue("title");
  const codeSnippet = confirmation.fields.getTextInputValue("code");
  return [confirmation, title, codeSnippet];
}

function buildConfigurationMessageComponents(settingsState) {
  return [
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder().setCustomId("theme").addOptions(
        themes.slice(0, 20).map((theme) =>
          new StringSelectMenuOptionBuilder()
            .setLabel(`Theme: ${theme.displayName}`)
            .setValue(theme.id)
            .setDefault(settingsState.theme === theme.id),
        ),
      ),
    ),
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder().setCustomId("windowMode").addOptions(
        ...["none", "terminal", "editor"].map((windowMode) =>
          new StringSelectMenuOptionBuilder()
            .setLabel(`Window Type: ${windowMode}`)
            .setValue(windowMode)
            .setDefault(settingsState.windowMode === windowMode),
        ),
      ),
    ),
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder().setCustomId("margin").addOptions(
        ...[
          ["none", "None"],
          ["1rem", "Small"],
          ["2rem", "Medium"],
          ["3rem", "Large"],
        ].map(([value, label]) =>
          new StringSelectMenuOptionBuilder()
            .setLabel(`Margin: ${label}`)
            .setValue(value)
            .setDefault(settingsState.margin === value),
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
    windowMode: "none",
    title: "",
    language: interaction.options.getString("language"),
    margin: "1rem",
  };

  let [modalResponse, title, codeSnippet] =
    await getCodeSnippetViaModel(interaction);
  if (title.length > 0) {
    settingsState.windowMode = "terminal";
  }
  logger.info("Modal completed, code snippet retrieved");
  await modalResponse.deferReply({ flags: MessageFlags.Ephemeral });
  let image = await renderCode({
    code: codeSnippet,
    ...settingsState,
  });

  logger.info("Image rendered, editing modal response");
  let configInteraction = await modalResponse.editReply({
    files: [image],
    components: buildConfigurationMessageComponents(settingsState),
    flags: MessageFlags.Ephemeral,
  });
  logger.info("Modal editReply completed. Entering loop...");

  const filter = (i) => i.user.id === interaction.user.id;
  let i = 0;
  while (true) {
    try {
      logger.info(`Beginning wait for config interaction. (i=${i})`);
      configInteraction = await configInteraction.awaitMessageComponent({
        filter,
        time: TIMEOUT,
        dispose: true,
      });
      logger.info(
        `Got config interaction: ${configInteraction.customId} (i=${i})`,
      );
      i += 1;
    } catch (error) {
      logger.info(
        `Config interaction timed out. Breaking out of loop... (i=${i})`,
      );
      break;
    }

    const interactionId = configInteraction.customId;
    if (interactionId === "cancel") {
      await modalResponse.deleteReply();
      break;
    } else if (interactionId === "confirm") {
      await configInteraction.reply({
        files: [image],
      });
      await modalResponse.deleteReply();
      break;
    } else if (interactionId in settingsState) {
      settingsState[interactionId] = configInteraction.values[0];
      logger.info(
        `User changed ${interactionId} to: ${settingsState[interactionId]}, deferring update`,
      );
      await configInteraction.deferUpdate();
      logger.info(`Update deferred, rendering code`);
      image = await renderCode({
        code: codeSnippet,
        ...settingsState,
      });
      logger.info(`Code rendered, updating modalResponse`);

      configInteraction = await modalResponse.editReply({
        files: [image],
        components: buildConfigurationMessageComponents(settingsState),
      });
      logger.info(`Response updated, config loop complete.`);
    } else if (interactionId === "window-mode") {
      windowMode = configInteraction.values[0];
      logger.info(`User changed window mode to: ${windowMode}`);
    }
  }
}
