// Require the necessary discord.js classes
import { config } from "dotenv";
import { Client, Collection, Events, GatewayIntentBits } from "discord.js";
import { execute as handler } from "./src/discord_command_handler.js";

const token = config().parsed.TOKEN;

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// When the client is ready, run this code (only once).
// The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
// It makes some properties non-nullable.
client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

// Log in to Discord with your client's token
client.login(token);

// client.commands = new Collection();
// client.commands.set("carbon", execute);

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  // const commandName = interaction.commandName;
  // console.debug(`Received interaction with name: ${commandName}`);
  // const command = interaction.client.commands.get(interaction.commandName);

  // if (!command) {
  //   console.error(`No command matching ${interaction.commandName} was found.`);
  //   return;
  // }

  try {
    await handler(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "There was an error while executing this command!",
        flags: MessageFlags.Ephemeral,
      });
    } else {
      await interaction.reply({
        content: "There was an error while executing this command!",
        flags: MessageFlags.Ephemeral,
      });
    }
  }
});
