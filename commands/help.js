const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")
const config = require("../config")

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Shows help information about the bot")
    .addStringOption((option) =>
      option
        .setName("command")
        .setDescription("Get detailed help for a specific command")
        .setRequired(false)
        .addChoices(
          { name: "welcome", value: "welcome" },
          { name: "leave", value: "leave" },
          { name: "config", value: "config" },
          { name: "role", value: "role" },
        ),
    ),

  name: "help",
  description: "Shows help information about the bot",

  async execute(interaction) {
    const commandName = interaction.commandName
      ? interaction.options.getString("command")
      : interaction.content.slice(config.prefix.length).trim().split(/ +/)[1]

    if (commandName) {
      // Show detailed help for a specific command
      return this.showCommandHelp(interaction, commandName)
    } else {
      // Show general help
      return this.showGeneralHelp(interaction)
    }
  },

  async showGeneralHelp(interaction) {
    const prefix = config.prefix
    const isSlashCommand = Boolean(interaction.commandName)

    const embed = new EmbedBuilder()
      .setColor("#5865F2")
      .setTitle("Discord Welcome & Leave Bot")
      .setDescription("A customizable welcome and leave message bot for your Discord server.")
      .addFields(
        {
          name: "🎉 Welcome Commands",
          value: `\`${isSlashCommand ? "/" : prefix}help welcome\` - View welcome message commands`,
        },
        {
          name: "👋 Leave Commands",
          value: `\`${isSlashCommand ? "/" : prefix}help leave\` - View leave message commands`,
        },
        {
          name: "⚙️ Configuration",
          value: `\`${isSlashCommand ? "/" : prefix}help config\` - View configuration commands`,
        },
        {
          name: "🏷️ Role Management",
          value: `\`${isSlashCommand ? "/" : prefix}help role\` - View role management commands`,
        },
      )
      .setFooter({
        text: `Use ${isSlashCommand ? "/" : prefix}help [command] for detailed information`,
      })

    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({ embeds: [embed] })
      } else {
        await interaction.reply({ embeds: [embed] })
      }
    } catch (error) {
      console.error("Error sending help message:", error)
    }
  },

  async showCommandHelp(interaction, commandName) {
    const prefix = config.prefix
    const isSlashCommand = Boolean(interaction.commandName)
    const cmdPrefix = isSlashCommand ? "/" : prefix

    const embed = new EmbedBuilder().setColor("#5865F2")

    switch (commandName.toLowerCase()) {
      case "welcome":
        embed
          .setTitle("Welcome Command Help")
          .setDescription("Commands for managing welcome messages")
          .addFields(
            {
              name: `${cmdPrefix}welcome test [mode] [channel]`,
              value: "Test the welcome message (mode: embed/text)",
            },
            {
              name: `${cmdPrefix}welcome toggle`,
              value: "Toggle welcome messages on/off",
            },
            {
              name: `${cmdPrefix}welcome channel add/remove #channel [mode]`,
              value: "Add or remove a welcome channel",
            },
            {
              name: `${cmdPrefix}welcome edit [setting] [value]`,
              value: "Edit welcome message settings (color, title, description, image, thumbnail, footer, text)",
            },
            {
              name: `${cmdPrefix}welcome canvas [on/off/gradient]`,
              value: "Configure canvas image generation",
            },
          )
        break

      case "leave":
        embed
          .setTitle("Leave Command Help")
          .setDescription("Commands for managing leave messages")
          .addFields(
            {
              name: `${cmdPrefix}leave test [mode] [channel]`,
              value: "Test the leave message (mode: embed/text)",
            },
            {
              name: `${cmdPrefix}leave toggle`,
              value: "Toggle leave messages on/off",
            },
            {
              name: `${cmdPrefix}leave channel add/remove #channel [mode]`,
              value: "Add or remove a leave channel",
            },
            {
              name: `${cmdPrefix}leave edit [setting] [value]`,
              value: "Edit leave message settings (color, title, description, image, thumbnail, footer, text)",
            },
            {
              name: `${cmdPrefix}leave canvas [on/off/gradient]`,
              value: "Configure canvas image generation",
            },
          )
        break

      case "config":
        embed
          .setTitle("Configuration Command Help")
          .setDescription("Commands for configuring the bot")
          .addFields(
            {
              name: `${cmdPrefix}config reload`,
              value: "Reload the configuration file",
            },
            {
              name: `${cmdPrefix}config prefix [new-prefix]`,
              value: "Change the command prefix",
            },
            {
              name: `${cmdPrefix}config toggleprefix`,
              value: "Toggle prefix commands on/off",
            },
          )
        break

      case "role":
        embed
          .setTitle("Role Command Help")
          .setDescription("Commands for managing roles")
          .addFields(
            {
              name: `${cmdPrefix}role add [role]`,
              value: "Add a self-assignable role to yourself",
            },
            {
              name: `${cmdPrefix}role remove [role]`,
              value: "Remove a self-assignable role from yourself",
            },
            {
              name: `${cmdPrefix}role list`,
              value: "List all self-assignable roles",
            },
            {
              name: `${cmdPrefix}role configure [add/remove] [role]`,
              value: "Configure self-assignable roles (admin only)",
            },
          )
        break

      default:
        embed
          .setTitle("Command Not Found")
          .setDescription(`Command "${commandName}" not found. Use \`${cmdPrefix}help\` to see available commands.`)
    }

    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({ embeds: [embed] })
      } else {
        await interaction.reply({ embeds: [embed] })
      }
    } catch (error) {
      console.error("Error sending command help:", error)
    }
  },
}

