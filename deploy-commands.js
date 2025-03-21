// Script to deploy slash commands
const { REST, Routes } = require("discord.js")
const fs = require("node:fs")
const path = require("node:path")
require("dotenv").config()

// Get configuration
const token = process.env.DISCORD_BOT_TOKEN
const clientId = process.env.DISCORD_CLIENT_ID
const guildId = process.env.DISCORD_GUILD_ID

// Check for required environment variables
if (!token) {
  console.error("Missing DISCORD_BOT_TOKEN in environment variables")
  process.exit(1)
}

if (!clientId) {
  console.error("Missing DISCORD_CLIENT_ID in environment variables")
  process.exit(1)
}

// Prepare commands array
const commands = []
const commandsPath = path.join(__dirname, "commands")
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js"))

// Load all command files
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file)
  const command = require(filePath)

  if ("data" in command && command.data.toJSON) {
    commands.push(command.data.toJSON())
    console.log(`Loaded command: ${command.data.name}`)
  } else {
    console.log(`[WARNING] The command at ${filePath} is missing a required "data" property or toJSON method.`)
  }
}

// Set up REST API client
const rest = new REST({ version: "10" }).setToken(token)

// Deploy commands function
async function deployCommands() {
  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`)

    let data

    if (guildId) {
      // Guild commands - faster to update but only work in the specified guild
      console.log(`Deploying guild commands to guild ID: ${guildId}`)

      try {
        data = await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
        console.log(`Successfully reloaded ${data.length} guild (/) commands.`)
      } catch (error) {
        console.error("Error deploying guild commands - falling back to global commands")
        console.log("This is normal if the bot isn't in the specified guild or lacks permissions.")

        // Fall back to global commands if guild deployment fails
        data = await rest.put(Routes.applicationCommands(clientId), { body: commands })
        console.log(`Successfully deployed ${data.length} global (/) commands as fallback.`)
        console.log("Note: Global commands may take up to an hour to propagate to all servers.")
      }
    } else {
      // Global commands - work in all guilds but take up to an hour to update
      console.log("Deploying global commands (this may take up to an hour to propagate)")
      data = await rest.put(Routes.applicationCommands(clientId), { body: commands })
      console.log(`Successfully reloaded ${data.length} global (/) commands.`)
    }

    // Log all registered commands
    console.log("Registered commands:")
    data.forEach((cmd) => {
      console.log(`- ${cmd.name}`)
    })
  } catch (error) {
    // Log detailed error information
    console.error("Error deploying commands:")
    if (error.response) {
      console.error(`Status: ${error.response.status}`)
      console.error(`Response: ${JSON.stringify(error.response.data, null, 2)}`)
    } else {
      console.error(error)
    }
  }
}

deployCommands()

