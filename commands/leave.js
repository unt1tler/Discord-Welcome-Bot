// Slash command for leave message testing
const { SlashCommandBuilder, PermissionFlagsBits, AttachmentBuilder } = require("discord.js")
const { createLeaveEmbed, formatLeaveText } = require("../utils/messageUtils")
const { createLeaveCard } = require("../utils/canvasUtils")
const config = require("../config")
const db = require("../utils/database")

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leave")
    .setDescription("Leave message commands")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild) // Set permissions at command level
    .addSubcommand((subcommand) =>
      subcommand
        .setName("test")
        .setDescription("Test the leave message")
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
    .addSubcommand((subcommand) => subcommand.setName("toggle").setDescription("Toggle leave messages on/off"))
    .addSubcommand((subcommand) =>
      subcommand
        .setName("channel")
        .setDescription("Add or remove a leave channel")
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
        .setDescription("Edit leave message settings")
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
        )
        .addStringOption((option) =>
          option.setName("guild").setDescription("Guild ID (for multi-guild support, admin only)").setRequired(false),
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
  name: "leave",
  description: "Leave message commands",

  async execute(interaction, client) {
    // Get guild configuration
    const guildId = interaction.guild.id
    const useDatabase = process.env.USE_DATABASE === "true"

    // Initialize guild config if it doesn't exist
    if (!config.guilds) {
      config.guilds = {}
    }

    // Get guild config from database if enabled
    let guildConfig
    if (useDatabase) {
      try {
        // Try to get from database first
        guildConfig = await db.getGuildConfig(guildId)

        // If not found, initialize with defaults
        if (!guildConfig) {
          const defaultConfig = {
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
            roles: {
              enabled: true,
              autoAssign: [],
              selfAssignable: [],
            },
          }

          guildConfig = await db.initGuildConfig(guildId, defaultConfig)

          // Store in memory
          config.guilds[guildId] = guildConfig
        } else {
          // Update in-memory config
          config.guilds[guildId] = guildConfig
        }
      } catch (error) {
        console.error(`Error getting guild config from database for ${guildId}:`, error)
        // Fall back to in-memory config
        guildConfig = config.guilds[guildId]
      }
    } else {
      // Use in-memory config
      guildConfig = config.guilds[guildId]
    }

    if (!guildConfig) {
      // Clone the default config for this guild
      guildConfig = {
        leave: {
          enabled: true,
          channels: [],
          defaultMode: "embed",
          embed: { ...config.defaultLeaveEmbed },
          text: config.defaultLeaveText,
        },
        welcome: {
          enabled: true,
          channels: [],
          defaultMode: "embed",
          embed: { ...config.defaultWelcomeEmbed },
          text: config.defaultWelcomeText,
        },
      }

      // Store in memory
      config.guilds[guildId] = guildConfig
    }

    // Fix for the "Cannot read properties of undefined" errors
    // Ensure leave property exists
    if (!guildConfig.leave) {
      guildConfig.leave = {
        enabled: true,
        channels: [],
        defaultMode: "embed",
        embed: { ...config.defaultLeaveEmbed },
        text: config.defaultLeaveText,
      }
    }

    // Ensure leave.channels is an array
    if (!guildConfig.leave.channels) {
      guildConfig.leave.channels = []
    }

    // Check if this is a slash command or prefix command
    const isSlashCommand = Boolean(interaction.commandName)

    if (isSlashCommand) {
      // Slash command handling
      if (interaction.options.getSubcommand() === "test") {
        await interaction.deferReply()

        const mode = interaction.options.getString("mode") || guildConfig.leave.defaultMode || "embed"
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
            const result = await createLeaveEmbed(interaction.member, null, guildId)

            if (result.attachment) {
              await interaction.editReply({
                content: `Leave message preview for ${targetChannel}:`,
                embeds: [result.embed],
                files: [result.attachment],
              })
            } else {
              await interaction.editReply({
                content: `Leave message preview for ${targetChannel}:`,
                embeds: [result.embed],
              })
            }
          } catch (error) {
            console.error("Error generating leave embed:", error)
            await interaction.editReply("Error generating leave embed")
          }
        } else {
          try {
            const result = await formatLeaveText(interaction.member, null, guildId)

            if (result.attachment) {
              await interaction.editReply({
                content: `Leave message preview for ${targetChannel}:\n${result.text}`,
                files: [result.attachment],
              })
            } else {
              await interaction.editReply({
                content: `Leave message preview for ${targetChannel}:\n${result.text}`,
              })
            }
          } catch (error) {
            console.error("Error generating leave text:", error)
            await interaction.editReply("Error generating leave text")
          }
        }
      } else if (interaction.options.getSubcommand() === "toggle") {
        guildConfig.leave.enabled = !guildConfig.leave.enabled

        // Save to database if enabled
        if (useDatabase) {
          try {
            await db.saveGuildConfig(guildId, guildConfig)
          } catch (error) {
            console.error(`Error saving guild config to database for ${guildId}:`, error)
          }
        }

        await interaction.reply(
          `Leave messages are now ${guildConfig.leave.enabled ? "enabled" : "disabled"} for this server.`,
        )
      } else if (interaction.options.getSubcommand() === "channel") {
        const action = interaction.options.getString("action")
        const channel = interaction.options.getChannel("channel")
        const mode = interaction.options.getString("mode") || guildConfig.leave.defaultMode || "embed"

        if (!channel) {
          return interaction.reply({ content: "Invalid channel specified.", ephemeral: true })
        }

        // Initialize channels array if it doesn't exist
        if (!guildConfig.leave.channels) {
          guildConfig.leave.channels = []
        }

        if (action === "add") {
          // Check if channel already exists
          const existingChannel = guildConfig.leave.channels.find((c) => c.id === channel.id)
          if (existingChannel) {
            existingChannel.mode = mode
            console.log(`Updated leave channel ${channel.name} (${channel.id}) to use ${mode} mode`)
          } else {
            // Add the new channel
            guildConfig.leave.channels.push({
              id: channel.id,
              mode: mode,
            })
            console.log(`Added channel ${channel.id} to leave channels array for guild ${guildId}`)
            console.log(`Leave channels array now contains ${guildConfig.leave.channels.length} channels`)
            console.log(`Leave channels: ${JSON.stringify(guildConfig.leave.channels)}`)
          }

          // Save to database directly if enabled
          if (useDatabase) {
            try {
              const result = await db.saveGuildConfig(guildId, guildConfig)
              console.log(
                `Directly saved leave channel configuration to database for guild ${guildId}:`,
                result ? "Success" : "Failed",
              )

              // Verify the save by retrieving the config again
              const verifiedConfig = await db.getGuildConfig(guildId)
              console.log(
                `Verification after adding channel - leave channels: ${JSON.stringify(verifiedConfig.leave?.channels || [])}`,
              )
            } catch (error) {
              console.error(`Error saving guild config to database for ${guildId}:`, error)
            }
          }

          await interaction.reply(`Added ${channel} as a leave channel with ${mode} mode.`)
        } else if (action === "remove") {
          const channelIndex = guildConfig.leave.channels.findIndex((c) => c.id === channel.id)
          if (channelIndex !== -1) {
            guildConfig.leave.channels.splice(channelIndex, 1)

            // Save to database directly if enabled
            if (useDatabase) {
              try {
                const result = await db.saveGuildConfig(guildId, guildConfig)
                console.log(
                  `Saved updated leave channels (after removal) to database for guild ${guildId}:`,
                  result ? "Success" : "Failed",
                )

                // Verify the save by retrieving the config again
                const verifiedConfig = await db.getGuildConfig(guildId)
                console.log(
                  `Verification after removing channel - leave channels: ${JSON.stringify(verifiedConfig.leave?.channels || [])}`,
                )
              } catch (error) {
                console.error(`Error saving guild config to database for ${guildId}:`, error)
              }
            }

            await interaction.reply(`Removed ${channel} from leave channels.`)
          } else {
            await interaction.reply({ content: `${channel} is not configured as a leave channel.`, ephemeral: true })
          }
        }
      } else if (interaction.options.getSubcommand() === "edit") {
        const setting = interaction.options.getString("setting")
        const value = interaction.options.getString("value")
        const targetGuildId = interaction.options.getString("guild") || guildId

        // Check if user has permission to edit other guild settings
        if (targetGuildId !== guildId && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
          return interaction.reply({
            content: "You don't have permission to edit settings for other guilds.",
            ephemeral: true,
          })
        }

        // Make sure the target guild config exists
        if (!config.guilds[targetGuildId]) {
          config.guilds[targetGuildId] = {
            leave: {
              enabled: true,
              channels: [],
              defaultMode: "embed",
              embed: { ...config.defaultLeaveEmbed },
              text: config.defaultLeaveText,
            },
            welcome: {
              enabled: true,
              channels: [],
              defaultMode: "embed",
              embed: { ...config.defaultWelcomeEmbed },
              text: config.defaultWelcomeText,
            },
          }
        }

        const targetConfig = config.guilds[targetGuildId].leave

        // Ensure embed property exists
        if (!targetConfig.embed) {
          targetConfig.embed = { ...config.defaultLeaveEmbed }
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
            targetConfig.embed.color = value
            await interaction.reply(`Leave message color updated to ${value}.`)
            break

          case "title":
            targetConfig.embed.title = value
            await interaction.reply(`Leave message title updated to "${value}".`)
            break

          case "description":
            targetConfig.embed.description = value
            await interaction.reply(`Leave message description updated.`)
            break

          case "image":
            targetConfig.embed.image = value
            targetConfig.embed.useCanvas = false // Disable canvas when setting custom image
            await interaction.reply(`Leave message image updated.`)
            break

          case "thumbnail":
            if (value.toLowerCase() === "user") {
              targetConfig.embed.thumbnail = "user"
              await interaction.reply(`Leave message thumbnail set to use user avatar.`)
            } else {
              targetConfig.embed.thumbnail = value
              await interaction.reply(`Leave message thumbnail updated.`)
            }
            break

          case "footer":
            targetConfig.embed.footer = targetConfig.embed.footer || {}
            targetConfig.embed.footer.text = value
            await interaction.reply(`Leave message footer updated.`)
            break

          case "text":
            targetConfig.text = value
            await interaction.reply(`Leave text message updated.`)
            break

          default:
            await interaction.reply({ content: "Invalid setting specified.", ephemeral: true })
        }

        // Save to database if enabled
        if (useDatabase) {
          try {
            await db.saveGuildConfig(targetGuildId, config.guilds[targetGuildId])
          } catch (error) {
            console.error(`Error saving guild config to database for ${targetGuildId}:`, error)
          }
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
        if (!guildConfig.leave.embed.canvasOptions) {
          guildConfig.leave.embed.canvasOptions = {}
        }

        // Toggle canvas for embed
        if (mode === "embed" || mode === "both") {
          guildConfig.leave.embed.useCanvas = enabled
        }

        // Toggle canvas for text mode
        if (mode === "text" || mode === "both") {
          guildConfig.leave.useCanvasWithText = enabled
        }

        // Process gradient if provided
        if (gradient) {
          const colors = gradient.split(",")
          if (colors.length === 2 && colors.every((color) => /^#[0-9A-F]{6}$/i.test(color))) {
            guildConfig.leave.embed.canvasOptions.gradientStart = colors[0]
            guildConfig.leave.embed.canvasOptions.gradientEnd = colors[1]
          } else {
            return interaction.reply({
              content: "Invalid gradient format. Use two hex colors separated by a comma (e.g., #F04747,#B52E31).",
              ephemeral: true,
            })
          }
        }

        // Generate a test image with the new settings
        if (enabled && isCanvasAvailable) {
          try {
            await interaction.deferReply()
            const cardBuffer = await createLeaveCard(interaction.member, guildConfig.leave.embed.canvasOptions)

            if (cardBuffer) {
              const attachment = new AttachmentBuilder(cardBuffer, { name: "leave-card.png" })
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

        // Save to database if enabled
        if (useDatabase) {
          try {
            await db.saveGuildConfig(guildId, guildConfig)
          } catch (error) {
            console.error(`Error saving guild config to database for ${guildId}:`, error)
          }
        }
      }
    } else if (interaction.content) {
      // Prefix command handling
      const args = interaction.content.slice(config.prefix.length).trim().split(/ +/)
      const subCommand = args[1]

      if (subCommand === "test") {
        const mode = args[2] || guildConfig.leave.defaultMode || "embed"

        if (mode === "embed") {
          try {
            const result = await createLeaveEmbed(interaction.member, null, guildId)

            if (result.attachment) {
              await interaction.reply({
                content: "Leave message preview:",
                embeds: [result.embed],
                files: [result.attachment],
              })
            } else {
              await interaction.reply({
                content: "Leave message preview:",
                embeds: [result.embed],
              })
            }
          } catch (error) {
            console.error("Error generating leave embed:", error)
            await interaction.reply("Error generating leave embed")
          }
        } else {
          try {
            const result = await formatLeaveText(interaction.member, null, guildId)

            if (result.attachment) {
              await interaction.reply({
                content: `Leave message preview:\n${result.text}`,
                files: [result.attachment],
              })
            } else {
              await interaction.reply(`Leave message preview:\n${result.text}`)
            }
          } catch (error) {
            console.error("Error generating leave text:", error)
            await interaction.reply("Error generating leave text")
          }
        }
      } else if (subCommand === "toggle") {
        // Check permissions
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
          return interaction.reply("You don't have permission to use this command.")
        }

        guildConfig.leave.enabled = !guildConfig.leave.enabled

        // Save to database if enabled
        if (useDatabase) {
          try {
            await db.saveGuildConfig(guildId, guildConfig)
          } catch (error) {
            console.error(`Error saving guild config to database for ${guildId}:`, error)
          }
        }

        await interaction.reply(
          `Leave messages are now ${guildConfig.leave.enabled ? "enabled" : "disabled"} for this server.`,
        )
      } else if (subCommand === "channel") {
        // Check permissions
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
          return interaction.reply("You don't have permission to use this command.")
        }

        const action = args[2]
        const channelMention = args[3]
        const mode = args[4] || guildConfig.leave.defaultMode || "embed"

        if (!action || !channelMention || !["add", "remove"].includes(action)) {
          return interaction.reply("Invalid syntax. Use `!leave channel add/remove #channel [mode]`")
        }

        // Extract channel ID from mention
        const channelId = channelMention.replace(/[<#>]/g, "")
        const channel = interaction.guild.channels.cache.get(channelId)

        if (!channel) {
          return interaction.reply("Invalid channel specified.")
        }

        // Initialize channels array if it doesn't exist
        if (!guildConfig.leave.channels) {
          guildConfig.leave.channels = []
        }

        if (action === "add") {
          // Check if channel already exists
          const existingChannel = guildConfig.leave.channels.find((c) => c.id === channel.id)
          if (existingChannel) {
            existingChannel.mode = mode
            console.log(`Updated leave channel ${channel.name} (${channel.id}) to use ${mode} mode`)
            await interaction.reply(`Updated leave channel ${channel} to use ${mode} mode.`)
          } else {
            // Add the new channel
            guildConfig.leave.channels.push({
              id: channel.id,
              mode: mode,
            })
            console.log(`Added channel ${channel.id} to leave channels array for guild ${guildId}`)
            console.log(`Leave channels array now contains ${guildConfig.leave.channels.length} channels`)
            console.log(`Leave channels: ${JSON.stringify(guildConfig.leave.channels)}`)

            await interaction.reply(`Added ${channel} as a leave channel with ${mode} mode.`)
          }

          // Save to database if enabled
          if (useDatabase) {
            try {
              const result = await db.saveGuildConfig(guildId, guildConfig)
              console.log(
                `Saved leave channel configuration to database for guild ${guildId}:`,
                result ? "Success" : "Failed",
              )

              // Verify the save by retrieving the config again
              const verifiedConfig = await db.getGuildConfig(guildId)
              console.log(
                `Verification after adding channel - leave channels: ${JSON.stringify(verifiedConfig.leave?.channels || [])}`,
              )
            } catch (error) {
              console.error(`Error saving guild config to database for ${guildId}:`, error)
            }
          }
        } else if (action === "remove") {
          const channelIndex = guildConfig.leave.channels.findIndex((c) => c.id === channel.id)
          if (channelIndex !== -1) {
            guildConfig.leave.channels.splice(channelIndex, 1)
            await interaction.reply(`Removed ${channel} from leave channels.`)

            // Save to database if enabled
            if (useDatabase) {
              try {
                const result = await db.saveGuildConfig(guildId, guildConfig)
                console.log(
                  `Saved updated leave channels (after removal) to database for guild ${guildId}:`,
                  result ? "Success" : "Failed",
                )

                // Verify the save by retrieving the config again
                const verifiedConfig = await db.getGuildConfig(guildId)
                console.log(
                  `Verification after removing channel - leave channels: ${JSON.stringify(verifiedConfig.leave?.channels || [])}`,
                )
              } catch (error) {
                console.error(`Error saving guild config to database for ${guildId}:`, error)
              }
            }
          } else {
            await interaction.reply(`${channel} is not configured as a leave channel.`)
          }
        }
      }
    }
  },
}

