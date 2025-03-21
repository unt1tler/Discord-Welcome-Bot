// Slash command for config management
const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js")
const fs = require("fs")
const path = require("path")
const config = require("../config")

module.exports = {
  data: new SlashCommandBuilder()
    .setName("config")
    .setDescription("Configuration commands")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((subcommand) => subcommand.setName("reload").setDescription("Reload the configuration file"))
    .addSubcommand((subcommand) =>
      subcommand
        .setName("prefix")
        .setDescription("Change the command prefix")
        .addStringOption((option) => option.setName("prefix").setDescription("New prefix").setRequired(true)),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("mode")
        .setDescription("Change welcome/leave message mode")
        .addStringOption((option) =>
          option
            .setName("type")
            .setDescription("Message type to change")
            .setRequired(true)
            .addChoices({ name: "Welcome", value: "welcome" }, { name: "Leave", value: "leave" }),
        )
        .addStringOption((option) =>
          option
            .setName("mode")
            .setDescription("Message mode")
            .setRequired(true)
            .addChoices({ name: "Embed", value: "embed" }, { name: "Text", value: "text" }),
        ),
    )
    .addSubcommand((subcommand) => subcommand.setName("toggleprefix").setDescription("Toggle prefix commands on/off")),

  // For prefix commands
  name: "config",
  description: "Configuration commands",

  async execute(interaction, client) {
    // Check if user has permission to manage guild
    let hasPermission = false

    // Check if this is a slash command or prefix command
    const isSlashCommand = Boolean(interaction.commandName)

    if (isSlashCommand) {
      hasPermission = interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)
    } else if (interaction.content) {
      hasPermission = interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)
    }

    if (!hasPermission) {
      const response = "You don't have permission to use this command."
      if (isSlashCommand) {
        return interaction.reply({ content: response, ephemeral: true })
      } else {
        return interaction.reply(response)
      }
    }

    // Get guild ID
    const guildId = interaction.guild.id

    // Initialize guild config if it doesn't exist
    if (!config.guilds) {
      config.guilds = {}
    }

    if (!config.guilds[guildId]) {
      config.guilds[guildId] = {
        welcome: {
          enabled: true,
          channels: [],
          defaultMode: "embed",
          embed: { ...config.defaultWelcomeEmbed },
          text: config.defaultWelcomeText,
        },
        leave: {
          enabled: true,
          channels: [],
          defaultMode: "embed",
          embed: { ...config.defaultLeaveEmbed },
          text: config.defaultLeaveText,
        },
      }
    }

    // Ensure welcome and leave properties exist
    if (!config.guilds[guildId].welcome) {
      config.guilds[guildId].welcome = {
        enabled: true,
        channels: [],
        defaultMode: "embed",
        embed: { ...config.defaultWelcomeEmbed },
        text: config.defaultWelcomeText,
      }
    }

    if (!config.guilds[guildId].leave) {
      config.guilds[guildId].leave = {
        enabled: true,
        channels: [],
        defaultMode: "embed",
        embed: { ...config.defaultLeaveEmbed },
        text: config.defaultLeaveText,
      }
    }

    if (isSlashCommand) {
      // Slash command handling
      if (interaction.options.getSubcommand() === "reload") {
        try {
          delete require.cache[require.resolve("../config")]
          const newConfig = require("../config")
          Object.assign(config, newConfig)
          await interaction.reply("Configuration reloaded successfully!")
        } catch (error) {
          console.error(error)
          await interaction.reply({ content: "Error reloading configuration!", ephemeral: true })
        }
      } else if (interaction.options.getSubcommand() === "prefix") {
        const newPrefix = interaction.options.getString("prefix")

        // Update the global config
        config.prefix = newPrefix

        // Update guild-specific config
        if (!config.guilds[guildId]) {
          config.guilds[guildId] = {}
        }

        config.guilds[guildId].prefix = newPrefix

        // Save to database if enabled
        if (config.database && config.database.enabled) {
          try {
            await require("../utils/database").saveGuildConfig(guildId, config.guilds[guildId])
            console.log(`Saved prefix configuration to database for guild ${guildId}`)
          } catch (error) {
            console.error(`Error saving guild config to database for ${guildId}:`, error)
          }
        }

        await interaction.reply(`Command prefix changed to \`${newPrefix}\``)
      } else if (interaction.options.getSubcommand() === "mode") {
        const type = interaction.options.getString("type")
        const mode = interaction.options.getString("mode")

        // Make sure the guild config exists
        if (!config.guilds[guildId]) {
          config.guilds[guildId] = {}
        }

        // Make sure the type property exists with all required properties
        if (!config.guilds[guildId][type]) {
          if (type === "welcome") {
            config.guilds[guildId].welcome = {
              enabled: true,
              channels: [],
              defaultMode: "embed",
              embed: { ...config.defaultWelcomeEmbed },
              text: config.defaultWelcomeText,
            }
          } else if (type === "leave") {
            config.guilds[guildId].leave = {
              enabled: true,
              channels: [],
              defaultMode: "embed",
              embed: { ...config.defaultLeaveEmbed },
              text: config.defaultLeaveText,
            }
          }
        }

        // Now it's safe to set the defaultMode
        config.guilds[guildId][type].defaultMode = mode
        await interaction.reply(`Default ${type} message mode set to ${mode}`)

        // Save to database if enabled
        if (config.database && config.database.enabled) {
          try {
            await require("../utils/database").saveGuildConfig(guildId, config.guilds[guildId])
            console.log(`Saved ${type} mode configuration to database for guild ${guildId}`)
          } catch (error) {
            console.error(`Error saving guild config to database for ${guildId}:`, error)
          }
        }
      } else if (interaction.options.getSubcommand() === "toggleprefix") {
        config.enablePrefix = !config.enablePrefix
        await interaction.reply(`Prefix commands are now ${config.enablePrefix ? "enabled" : "disabled"}`)
      }
    } else if (interaction.content) {
      // Prefix command handling
      const args = interaction.content.slice(config.prefix.length).trim().split(/ +/)
      const subCommand = args[1]

      if (subCommand === "reload") {
        try {
          delete require.cache[require.resolve("../config")]
          const newConfig = require("../config")
          Object.assign(config, newConfig)
          await interaction.reply("Configuration reloaded successfully!")
        } catch (error) {
          console.error(error)
          await interaction.reply("Error reloading configuration!")
        }
      } else if (subCommand === "prefix") {
        const newPrefix = args[2]

        if (!newPrefix) {
          return interaction.reply("Please specify a new prefix.")
        }

        config.prefix = newPrefix
        await interaction.reply(`Command prefix changed to \`${newPrefix}\``)
      } else if (subCommand === "mode") {
        const type = args[2]
        const mode = args[3]

        if (!type || !mode || !["welcome", "leave"].includes(type) || !["embed", "text"].includes(mode)) {
          return interaction.reply("Invalid arguments. Usage: !config mode [welcome|leave] [embed|text]")
        }

        // Make sure the type property exists and has defaultMode
        if (!config.guilds[guildId][type]) {
          config.guilds[guildId][type] = {
            enabled: true,
            channels: [],
            defaultMode: "embed",
          }
        }

        config.guilds[guildId][type].defaultMode = mode
        await interaction.reply(`Default ${type} message mode set to ${mode}`)

        // Save to database if enabled
        if (config.database && config.database.enabled) {
          try {
            await require("../utils/database").saveGuildConfig(guildId, config.guilds[guildId])
          } catch (error) {
            console.error(`Error saving guild config to database for ${guildId}:`, error)
          }
        }
      } else if (subCommand === "toggleprefix") {
        config.enablePrefix = !config.enablePrefix
        await interaction.reply(`Prefix commands are now ${config.enablePrefix ? "enabled" : "disabled"}`)
      }
    }
  },
}

