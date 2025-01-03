import fs from "node:fs";
import path from "node:path";

export default async function loadCommands() {
  const commands = [];
  // Grab all the command folders from the commands directory you created earlier
  const foldersPath = path.join(import.meta.dirname, "..", "commands");
  const commandFolders = fs.readdirSync(foldersPath);

  for (const folder of commandFolders) {
    // Grab all the command files from the commands directory you created earlier
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs
      .readdirSync(commandsPath)
      .filter((file) => file.endsWith(".js"));
    // Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
    for (const file of commandFiles) {
      const importPath = `../commands/${folder}/${file}`;
      const command = await import(importPath);
      if ("data" in command && "execute" in command) {
        commands.push(command);
      } else {
        console.log(
          `[WARNING] The command at ${importPath} is missing a required "data" or "execute" property.`,
        );
      }
    }
  }
  return commands;
}
