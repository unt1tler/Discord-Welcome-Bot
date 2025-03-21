// Slash command for welcome message testing
const { SlashCommandBuilder, PermissionFlagsBits, AttachmentBuilder } = require("discord.js")
const { createWelcomeEmbed, formatWelcomeText } = require("../utils/messageUtils")
const { createWelcomeCard } = require("../utils/canvasUtils")
const config = require("../config")

module.exports = {
  data: new SlashCommandBuilder()
    .setName("welcome")
    .setDescription("Welcome message commands")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild) // Set permissions at command level
    .addSubcommand((subcommand) =>
      subcommand
        .setName("test")
        .setDescription("Test the welcome message")
        .addStringOption((option) =>
          option
            .setName("mode")
            .setDescription("Message mode")
            .setRequired(false)
            .addChoices({ name: "Embed", value: "embed" }, { name: "Text", value: "text" }),
        )
        .addStringOption((option) =>
          option
            .setName("channel")
            .setDescription("Channel to test in (defaults to current channel)")
            .setRequired(false),
        ),
    )
    .addSubcommand((subcommand) => subcommand.setName("toggle").setDescription("Toggle welcome messages on/off"))
    .addSubcommand((subcommand) =>
      subcommand
        .setName("channel")
        .setDescription("Add or remove a welcome channel")
        .addStringOption((option) =>
          option
            .setName("action")
            .setDescription("Action to perform")
            .setRequired(true)
            .addChoices({ name: "Add", value: "add" }, { name: "Remove", value: "remove" }),
        )
        .addChannelOption((option) =>
          option.setName("channel").setDescription("Channel to add/remove").setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("mode")
            .setDescription("Message mode (for add action)")
            .setRequired(false)
            .addChoices({ name: "Embed", value: "embed" }, { name: "Text", value: "text" }),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("edit")
        .setDescription("Edit welcome message settings")
        .addStringOption((option) =>
          option
            .setName("setting")
            .setDescription("Setting to edit")
            .setRequired(true)
            .addChoices(
              { name: "Color", value: "color" },
              { name: "Title", value: "title" },
              { name: "Description", value: "description" },
              { name: "Image", value: "image" },
              { name: "Thumbnail", value: "thumbnail" },
              { name: "Footer", value: "footer" },
              { name: "Text", value: "text" },
            ),
        )
        .addStringOption((option) =>
          option.setName("value").setDescription("New value for the setting").setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("canvas")
        .setDescription("Configure canvas image generation")
        .addBooleanOption((option) =>
          option.setName("enabled").setDescription("Enable/disable canvas image generation").setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("mode")
            .setDescription("Where to use canvas")
            .setRequired(false)
            .addChoices(
              { name: "Embed Only", value: "embed" },
              { name: "Text Only", value: "text" },
              { name: "Both", value: "both" },
            ),
        )
        .addStringOption((option) =>
          option
            .setName("gradient")
            .setDescription("Canvas gradient (hex color format: #RRGGBB,#RRGGBB)")
            .setRequired(false),
        ),
    ),

  // For prefix commands
  name: "welcome",
  description: "Welcome message commands",

  async execute(interaction, client) {
    // Get guild configuration
    const guildId = interaction.guild.id

    // Initialize guild config if it doesn't exist
    if (!config.guilds) {
      config.guilds = {}
    }

    if (!config.guilds[guildId]) {
      // Create a new guild config with default welcome settings
      config.guilds[guildId] = {
        welcome: {
          enabled: true,
          channels: [],
          defaultMode: "embed",
          embed: { ...config.defaultWelcomeEmbed },
          text: config.defaultWelcomeText,
        },
      }
    }

    // Ensure welcome config exists for this guild
    if (!config.guilds[guildId].welcome) {
      config.guilds[guildId].welcome = {
        enabled: true,
        channels: [],
        defaultMode: "embed",
        embed: { ...config.defaultWelcomeEmbed },
        text: config.defaultWelcomeText,
      }
    }

    // Get guild-specific config
    const guildConfig = config.guilds[guildId]

    // Similar fix for welcome command to prevent potential similar issues
    // In the execute function, ensure welcome property and embed property exist
    if (!guildConfig.welcome) {
      guildConfig.welcome = {
        enabled: true,
        channels: [],
        defaultMode: "embed",
        embed: { ...config.defaultWelcomeEmbed },
        text: config.defaultWelcomeText,
      }
    }

    if (!guildConfig.welcome.embed) {
      guildConfig.welcome.embed = { ...config.defaultWelcomeEmbed }
    }

    if (interaction.commandName) {
      // Slash command handling
      if (interaction.options.getSubcommand() === "test") {
        await interaction.deferReply()

        const mode = interaction.options.getString("mode") || guildConfig.welcome.defaultMode || "embed"
        const channelOption = interaction.options.getString("channel")

        let targetChannel = interaction.channel
        if (channelOption) {
          const resolvedChannel =
            interaction.guild.channels.cache.get(channelOption) ||
            interaction.guild.channels.cache.find((c) => c.name === channelOption)
          if (resolvedChannel) {
            targetChannel = resolvedChannel
          }
        }

        if (mode === "embed") {
          try {
            const result = await createWelcomeEmbed(interaction.member, null, guildId)

            if (result.attachment) {
              await interaction.editReply({
                content: `Welcome message preview for ${targetChannel}:`,
                embeds: [result.embed],
                files: [result.attachment],
              })
            } else {
              await interaction.editReply({
                content: `Welcome message preview for ${targetChannel}:`,
                embeds: [result.embed],
              })
            }
          } catch (error) {
            console.error("Error generating welcome embed:", error)
            await interaction.editReply("Error generating welcome embed")
          }
        } else {
          try {
            const result = await formatWelcomeText(interaction.member, null, guildId)

            if (result.attachment) {
              await interaction.editReply({
                content: `Welcome message preview for ${targetChannel}:\n${result.text}`,
                files: [result.attachment],
              })
            } else {
              await interaction.editReply({
                content: `Welcome message preview for ${targetChannel}:\n${result.text}`,
              })
            }
          } catch (error) {
            console.error("Error generating welcome text:", error)
            await interaction.editReply("Error generating welcome text")
          }
        }
      } else if (interaction.options.getSubcommand() === "toggle") {
        if (!guildConfig.welcome) {
          guildConfig.welcome = { enabled: true }
        }

        guildConfig.welcome.enabled = !guildConfig.welcome.enabled
        await interaction.reply(
          `Welcome messages are now ${guildConfig.welcome.enabled ? "enabled" : "disabled"} for this server.`,
        )
      } else if (interaction.options.getSubcommand() === "channel") {
        const action = interaction.options.getString("action")
        const channel = interaction.options.getChannel("channel")
        const mode = interaction.options.getString("mode") || guildConfig.welcome.defaultMode || "embed"

        if (!channel) {
          return interaction.reply({ content: "Invalid channel specified.", ephemeral: true })
        }

        // Initialize channels array if it doesn't exist
        if (!guildConfig.welcome.channels) {
          guildConfig.welcome.channels = []
        }

        if (action === "add") {
          // Check if channel already exists
          const existingChannel = guildConfig.welcome.channels.find((c) => c.id === channel.id)
          if (existingChannel) {
            existingChannel.mode = mode
            await interaction.reply(`Updated welcome channel ${channel} to use ${mode} mode.`)
          } else {
            guildConfig.welcome.channels.push({
              id: channel.id,
              mode: mode,
            })

            // Log the updated channels array for debugging
            console.log(`Added welcome channel: ${channel.name} (${channel.id}) with mode: ${mode}`)
            console.log("Updated welcome channels array:", JSON.stringify(guildConfig.welcome.channels))

            await interaction.reply(`Added ${channel} as a welcome channel with ${mode} mode.`)
          }

          // Save to database if enabled
          if (config.database && config.database.enabled) {
            try {
              await require("../utils/database").saveGuildConfig(guildId, guildConfig)
            } catch (error) {
              console.error(`Error saving guild config to database for ${guildId}:`, error)
            }
          }
        } else if (action === "remove") {
          const channelIndex = guildConfig.welcome.channels.findIndex((c) => c.id === channel.id)
          if (channelIndex !== -1) {
            guildConfig.welcome.channels.splice(channelIndex, 1)
            await interaction.reply(`Removed ${channel} from welcome channels.`)

            // Save to database if enabled
            if (config.database && config.database.enabled) {
              try {
                await require("../utils/database").saveGuildConfig(guildId, guildConfig)
              } catch (error) {
                console.error(`Error saving guild config to database for ${guildId}:`, error)
              }
            }
          } else {
            await interaction.reply({ content: `${channel} is not configured as a welcome channel.`, ephemeral: true })
          }
        }
      } else if (interaction.options.getSubcommand() === "edit") {
        const setting = interaction.options.getString("setting")
        const value = interaction.options.getString("value")

        // Ensure embed object exists
        if (!guildConfig.welcome.embed) {
          guildConfig.welcome.embed = { ...config.defaultWelcomeEmbed }
        }

        switch (setting) {
          case "color":
            // Validate hex color
            if (!/^#[0-9A-F]{6}$/i.test(value)) {
              return interaction.reply({
                content: "Invalid color format. Please use hex format (e.g., #FF0000).",
                ephemeral: true,
              })
            }
            guildConfig.welcome.embed.color = value
            await interaction.reply(`Welcome message color updated to ${value}.`)
            break

          case "title":
            guildConfig.welcome.embed.title = value
            await interaction.reply(`Welcome message title updated to "${value}".`)
            break

          case "description":
            guildConfig.welcome.embed.description = value
            await interaction.reply(`Welcome message description updated.`)
            break

          case "image":
            guildConfig.welcome.embed.image = value
            guildConfig.welcome.embed.useCanvas = false // Disable canvas when setting custom image
            await interaction.reply(
              `Welcome message image updated. This image will be used in both embed and text modes.`,
            )
            break

          case "thumbnail":
            if (value.toLowerCase() === "user") {
              guildConfig.welcome.embed.thumbnail = "user"
              await interaction.reply(`Welcome message thumbnail set to use user avatar.`)
            } else {
              guildConfig.welcome.embed.thumbnail = value
              await interaction.reply(`Welcome message thumbnail updated.`)
            }
            break

          case "footer":
            guildConfig.welcome.embed.footer = guildConfig.welcome.embed.footer || {}
            guildConfig.welcome.embed.footer.text = value
            await interaction.reply(`Welcome message footer updated.`)
            break

          case "text":
            guildConfig.welcome.text = value
            await interaction.reply(`Welcome text message updated.`)
            break

          default:
            await interaction.reply({ content: "Invalid setting specified.", ephemeral: true })
        }
      } else if (interaction.options.getSubcommand() === "canvas") {
        const enabled = interaction.options.getBoolean("enabled")
        const mode = interaction.options.getString("mode") || "both"
        const gradient = interaction.options.getString("gradient")

        // Check if canvas is available
        const { isCanvasAvailable } = require("../utils/canvasUtils")

        if (!isCanvasAvailable && enabled) {
          return interaction.reply({
            content:
              "Canvas module is not installed. Image generation features are not available. Please install the canvas module to use this feature.",
            ephemeral: true,
          })
        }

        // Initialize canvas options if needed
        if (!guildConfig.welcome.embed.canvasOptions) {
          guildConfig.welcome.embed.canvasOptions = { ...config.defaultCanvasOptions.welcome }
        }

        // Toggle canvas for embed
        if (mode === "embed" || mode === "both") {
          guildConfig.welcome.embed.useCanvas = enabled
        }

        // Toggle canvas for text mode
        if (mode === "text" || mode === "both") {
          guildConfig.welcome.useCanvasWithText = enabled
        }

        // Process gradient if provided
        if (gradient) {
          const colors = gradient.split(",")
          if (colors.length === 2 && colors.every((color) => /^#[0-9A-F]{6}$/i.test(color))) {
            guildConfig.welcome.embed.canvasOptions.gradientStart = colors[0]
            guildConfig.welcome.embed.canvasOptions.gradientEnd = colors[1]
          } else {
            return interaction.reply({
              content: "Invalid gradient format. Use two hex colors separated by a comma (e.g., #5865F2,#4752C4).",
              ephemeral: true,
            })
          }
        }

        // Generate a test image with the new settings
        if (enabled && isCanvasAvailable) {
          try {
            await interaction.deferReply()
            const cardBuffer = await createWelcomeCard(interaction.member, guildConfig.welcome.embed.canvasOptions)

            if (cardBuffer) {
              const attachment = new AttachmentBuilder(cardBuffer, { name: "welcome-card.png" })
              await interaction.editReply({
                content: `Canvas image generation ${enabled ? "enabled" : "disabled"} for ${mode} mode(s). Here's a preview:`,
                files: [attachment],
              })
            } else {
              await interaction.editReply(
                `Canvas image generation ${enabled ? "enabled" : "disabled"} for ${mode} mode(s).`,
              )
            }
          } catch (error) {
            console.error("Error generating canvas preview:", error)
            await interaction.editReply(
              `Canvas image generation ${enabled ? "enabled" : "disabled"} for ${mode} mode(s).`,
            )
          }
        } else {
          await interaction.reply(
            `Canvas image generation ${enabled ? "enabled" : "disabled"} for ${mode} mode(s).${!isCanvasAvailable && enabled ? " Note: Canvas module is not installed, so images won't be generated." : ""}`,
          )
        }
      }
    } else if (interaction.content) {
      // Prefix command handling
      const args = interaction.content.slice(config.prefix.length).trim().split(/ +/)
      const subCommand = args[1]

      if (subCommand === "test") {
        const mode = args[2] || guildConfig.welcome.defaultMode || "embed"

        if (mode === "embed") {
          try {
            const result = await createWelcomeEmbed(interaction.member, null, guildId)

            if (result.attachment) {
              await interaction.reply({
                content: "Welcome message preview:",
                embeds: [result.embed],
                files: [result.attachment],
              })
            } else {
              await interaction.reply({
                content: "Welcome message preview:",
                embeds: [result.embed],
              })
            }
          } catch (error) {
            console.error("Error generating welcome embed:", error)
            await interaction.reply("Error generating welcome embed")
          }
        } else {
          try {
            const result = await formatWelcomeText(interaction.member, null, guildId)

            if (result.attachment) {
              await interaction.reply({
                content: `Welcome message preview:\n${result.text}`,
                files: [result.attachment],
              })
            } else {
              await interaction.reply(`Welcome message preview:\n${result.text}`)
            }
          } catch (error) {
            console.error("Error generating welcome text:", error)
            await interaction.reply("Error generating welcome text")
          }
        }
      } else if (subCommand === "toggle") {
        // Check permissions
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
          return interaction.reply("You don't have permission to use this command.")
        }

        guildConfig.welcome.enabled = !guildConfig.welcome.enabled
        await interaction.reply(
          `Welcome messages are now ${guildConfig.welcome.enabled ? "enabled" : "disabled"} for this server.`,
        )
      } else if (subCommand === "channel") {
        // Check permissions
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
          return interaction.reply("You don't have permission to use this command.")
        }

        const action = args[2]
        const channelMention = args[3]
        const mode = args[4] || guildConfig.welcome.defaultMode || "embed"

        if (!action || !channelMention || !["add", "remove"].includes(action)) {
          return interaction.reply("Invalid syntax. Use `!welcome channel add/remove #channel [mode]`")
        }

        // Extract channel ID from mention
        const channelId = channelMention.replace(/[<#>]/g, "")
        const channel = interaction.guild.channels.cache.get(channelId)

        if (!channel) {
          return interaction.reply("Invalid channel specified.")
        }

        // Initialize channels array if it doesn't exist
        if (!guildConfig.welcome.channels) {
          guildConfig.welcome.channels = []
        }

        if (action === "add") {
          // Check if channel already exists
          const existingChannel = guildConfig.welcome.channels.find((c) => c.id === channel.id)
          if (existingChannel) {
            existingChannel.mode = mode
            await interaction.reply(`Updated welcome channel ${channel} to use ${mode} mode.`)
          } else {
            guildConfig.welcome.channels.push({
              id: channel.id,
              mode: mode,
            })
            await interaction.reply(`Added ${channel} as a welcome channel with ${mode} mode.`)
          }
        } else if (action === "remove") {
          const channelIndex = guildConfig.welcome.channels.findIndex((c) => c.id === channel.id)
          if (channelIndex !== -1) {
            guildConfig.welcome.channels.splice(channelIndex, 1)
            await interaction.reply(`Removed ${channel} from welcome channels.`)
          } else {
            await interaction.reply(`${channel} is not configured as a welcome channel.`)
          }
        }
      } else if (subCommand === "edit") {
        // Check permissions
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
          return interaction.reply("You don't have permission to use this command.")
        }

        const setting = args[2]
        const value = args.slice(3).join(" ")

        if (!setting || !value) {
          return interaction.reply("Invalid syntax. Use `!welcome edit [setting] [value]`")
        }

        // Ensure embed object exists
        if (!guildConfig.welcome.embed) {
          guildConfig.welcome.embed = { ...config.defaultWelcomeEmbed }
        }

        switch (setting.toLowerCase()) {
          case "color":
            // Validate hex color
            if (!/^#[0-9A-F]{6}$/i.test(value)) {
              return interaction.reply("Invalid color format. Please use hex format (e.g., #FF0000).")
            }
            guildConfig.welcome.embed.color = value
            await interaction.reply(`Welcome message color updated to ${value}.`)
            break

          case "title":
            guildConfig.welcome.embed.title = value
            await interaction.reply(`Welcome message title updated to "${value}".`)
            break

          case "description":
            guildConfig.welcome.embed.description = value
            await interaction.reply(`Welcome message description updated.`)
            break

          case "image":
            guildConfig.welcome.embed.image = value
            guildConfig.welcome.embed.useCanvas = false // Disable canvas when setting custom image
            await interaction.reply(
              `Welcome message image updated. This image will be used in both embed and text modes.`,
            )
            break

          case "thumbnail":
            if (value.toLowerCase() === "user") {
              guildConfig.welcome.embed.thumbnail = "user"
              await interaction.reply(`Welcome message thumbnail set to use user avatar.`)
            } else {
              guildConfig.welcome.embed.thumbnail = value
              await interaction.reply(`Welcome message thumbnail updated.`)
            }
            break

          case "footer":
            guildConfig.welcome.embed.footer = guildConfig.welcome.embed.footer || {}
            guildConfig.welcome.embed.footer.text = value
            await interaction.reply(`Welcome message footer updated.`)
            break

          case "text":
            guildConfig.welcome.text = value
            await interaction.reply(`Welcome text message updated.`)
            break

          case "canvas":
            if (value.toLowerCase() === "on" || value.toLowerCase() === "true" || value === "1") {
              guildConfig.welcome.embed.useCanvas = true
              await interaction.reply("Canvas image generation enabled for welcome messages.")
            } else if (value.toLowerCase() === "off" || value.toLowerCase() === "false" || value === "0") {
              guildConfig.welcome.embed.useCanvas = false
              await interaction.reply("Canvas image generation disabled for welcome messages.")
            } else {
              await interaction.reply("Invalid value. Use 'on' or 'off'.")
            }
            break

          default:
            await interaction.reply(
              "Invalid setting specified. Available settings: color, title, description, image, thumbnail, footer, text, canvas",
            )
        }
      } else if (subCommand === "canvas") {
        // Check permissions
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
          return interaction.reply("You don't have permission to use this command.")
        }

        const action = args[2]

        if (!action || !["on", "off", "gradient"].includes(action.toLowerCase())) {
          return interaction.reply("Invalid syntax. Use `!welcome canvas [on|off|gradient] [values]`")
        }

        // Initialize canvas options if needed
        if (!guildConfig.welcome.embed.canvasOptions) {
          guildConfig.welcome.embed.canvasOptions = { ...config.defaultCanvasOptions.welcome }
        }

        if (action.toLowerCase() === "on") {
          guildConfig.welcome.embed.useCanvas = true
          guildConfig.welcome.useCanvasWithText = true

          try {
            const cardBuffer = await createWelcomeCard(interaction.member, guildConfig.welcome.embed.canvasOptions)

            if (cardBuffer) {
              const attachment = new AttachmentBuilder(cardBuffer, { name: "welcome-card.png" })
              await interaction.reply({
                content: "Canvas image generation enabled for welcome messages. Here's a preview:",
                files: [attachment],
              })
            } else {
              await interaction.reply("Canvas image generation enabled for welcome messages.")
            }
          } catch (error) {
            console.error("Error generating canvas preview:", error)
            await interaction.reply("Canvas image generation enabled for welcome messages.")
          }
        } else if (action.toLowerCase() === "off") {
          guildConfig.welcome.embed.useCanvas = false
          guildConfig.welcome.useCanvasWithText = false
          await interaction.reply("Canvas image generation disabled for welcome messages.")
        } else if (action.toLowerCase() === "gradient") {
          const colors = args.slice(3, 5)

          if (colors.length !== 2 || !colors.every((color) => /^#[0-9A-F]{6}$/i.test(color))) {
            return interaction.reply(
              "Invalid gradient format. Use two hex colors (e.g., `!welcome canvas gradient #5865F2 #4752C4`).",
            )
          }

          guildConfig.welcome.embed.canvasOptions.gradientStart = colors[0]
          guildConfig.welcome.embed.canvasOptions.gradientEnd = colors[1]

          try {
            const cardBuffer = await createWelcomeCard(interaction.member, guildConfig.welcome.embed.canvasOptions)

            if (cardBuffer) {
              const attachment = new AttachmentBuilder(cardBuffer, { name: "welcome-card.png" })
              await interaction.reply({
                content: `Canvas gradient updated to ${colors[0]} → ${colors[1]}. Here's a preview:`,
                files: [attachment],
              })
            } else {
              await interaction.reply(`Canvas gradient updated to ${colors[0]} → ${colors[1]}.`)
            }
          } catch (error) {
            console.error("Error generating canvas preview:", error)
            await interaction.reply(`Canvas gradient updated to ${colors[0]} → ${colors[1]}.`)
          }
        }
      }
    }
  },
}

