import { REST, Routes } from "discord.js";
import { config } from "dotenv";
import { data } from "./src/discord_interaction_handler.js";

// const { clientId, guildId, token } = config().parsed;
const clientId = config().parsed.CLIENT_ID;
const guildId = config().parsed.GUILD_ID;
const token = config().parsed.TOKEN;

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(token);

// and deploy your commands!
(async () => {
  try {
    // The put method is used to fully refresh all commands in the guild with the current set
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
      body: [data.toJSON()],
    });

    console.log(`Successfully redeployed command definition to discord`);
  } catch (error) {
    // And of course, make sure you catch and log any errors!
    console.error(error);
  }
})();
