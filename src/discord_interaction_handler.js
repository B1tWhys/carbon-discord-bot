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

  const codeSnippet = confirmation.fields.getTextInputValue("code");
  return [confirmation, codeSnippet];
}

function buildConfigurationMessageComponents(
  currentThemeName,
  currentWindowMode,
) {
  return [
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("theme")
        .setPlaceholder("Change theme")
        .addOptions(
          themes.slice(0, 20).map((theme) =>
            new StringSelectMenuOptionBuilder()
              .setLabel(theme.displayName)
              .setValue(theme.id)
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
  logger.info("Modal completed, code snippet retrieved");
  await modalResponse.deferReply({ flags: MessageFlags.Ephemeral });
  let image = await renderCode({
    language: settingsState.language,
    code: codeSnippet,
    theme: settingsState.theme,
  });

  logger.info("Image rendered, editing modal response");
  let configInteraction = await modalResponse.editReply({
    files: [image],
    components: buildConfigurationMessageComponents(
      settingsState.theme,
      settingsState.windowMode,
    ),
    flags: MessageFlags.Ephemeral,
  });
  logger.info("Modal editReply completed. Entering loop...");

  const filter = (i) => i.user.id === interaction.user.id; // &&
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
        files: [await image],
      });
      await modalResponse.deleteReply();
      break;
    } else if (interactionId === "theme") {
      settingsState.theme = configInteraction.values[0];
      logger.info(
        `User changed theme to: ${settingsState.theme}, deferring update`,
      );
      await configInteraction.deferUpdate();
      logger.info(`Update deferred, rendering code`);
      image = await renderCode({
        language: settingsState.language,
        code: codeSnippet,
        theme: settingsState.theme,
      });
      logger.info(`Code rendered, updating modalResponse`);

      configInteraction = await modalResponse.editReply({
        files: [image],
        components: buildConfigurationMessageComponents(
          settingsState.theme,
          settingsState.windowMode,
        ),
      });
      logger.info(`Response updated, config loop complete.`);
    } else if (interactionId === "window-mode") {
      windowMode = configInteraction.values[0];
      logger.info(`User changed window mode to: ${windowMode}`);
    }
  }
}
