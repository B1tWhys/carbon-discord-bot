import { REST, Routes } from "discord.js";
import { config } from "dotenv";
import loadCommands from "./util/load_commands.js";

// const { clientId, guildId, token } = config().parsed;
const parsedConfig = config().parsed;
const clientId = config().parsed.CLIENT_ID;
const guildId = config().parsed.GUILD_ID;
const token = config().parsed.TOKEN;

const commands = (await loadCommands()).map((command) => command.data.toJSON());

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(token);

// and deploy your commands!
(async () => {
  try {
    console.log(
      `Started refreshing ${commands.length} application (/) commands.`,
    );

    // The put method is used to fully refresh all commands in the guild with the current set
    const data = await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands },
    );

    console.log(
      `Successfully reloaded ${data.length} application (/) commands.`,
    );
  } catch (error) {
    // And of course, make sure you catch and log any errors!
    console.error(error);
  }
})();
