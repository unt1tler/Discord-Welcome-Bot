// Main bot file
const { Client, GatewayIntentBits, Events, Collection, ActivityType, AttachmentBuilder } = require("discord.js")
const fs = require("fs")
const path = require("path")
const config = require("./config")
const { createWelcomeEmbed, formatWelcomeText, createLeaveEmbed, formatLeaveText } = require("./utils/messageUtils")
const { checkMilestones, checkAnniversaries } = require("./utils/eventUtils")
const { logEvent } = require("./utils/loggingUtils")
const db = require("./utils/database")
const { isRateLimited, setupRateLimits } = require("./utils/rateLimit")

// Load environment variables if .env file exists
try {
  require("dotenv").config()
  console.log("Environment variables loaded from .env file")
  console.log("USE_DATABASE:", process.env.USE_DATABASE)
  console.log("MONGODB_URI:", process.env.MONGODB_URI ? "Set (value hidden)" : "Not set")
} catch (err) {
  console.log("No .env file found, using config.js values")
}

// Create a new client instance with expanded intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildModeration,
  ],
})

// Collection for commands
client.commands = new Collection()
client.slashCommands = new Collection()

// Initialize guild configs
client.guildConfigs = new Collection()

// Load command files
const commandsPath = path.join(__dirname, "commands")
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js"))

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file)
  const command = require(filePath)

  if ("data" in command && "execute" in command) {
    client.slashCommands.set(command.data.name, command)
    console.log(`Loaded slash command: ${command.data.name}`)
  }

  if ("name" in command && "execute" in command) {
    client.commands.set(command.name, command)
    console.log(`Loaded prefix command: ${command.name}`)
  }
}

// When the client is ready, run this code (only once)
client.once(Events.ClientReady, async () => {
  console.log(`Ready! Logged in as ${client.user.tag}`)
  console.log("\x1b[35m%s\x1b[0m", "Made with <3 by unt1tle")

  // Check if canvas is available
  try {
    const { isCanvasAvailable } = require("./utils/canvasUtils")
    if (isCanvasAvailable) {
      console.log("Canvas module is available. Image generation features are enabled.")
    } else {
      console.log("Canvas module is not available. Image generation features are disabled.")
      console.log("To enable image generation, install the canvas module: npm install canvas")
    }
  } catch (error) {
    console.error("Error checking canvas availability:", error)
  }

  // Set bot activity status
  client.user.setPresence({
    activities: [{ name: `Welcoming new members | ${config.prefix}help`, type: ActivityType.Watching }],
    status: "online",
  })

  // Initialize database if enabled
  const useDatabase = process.env.USE_DATABASE === "true"
  console.log("Database enabled:", useDatabase)

  if (useDatabase) {
    try {
      await db.connectToDatabase()
      console.log("Connected to MongoDB database")

      // Load all guild configs from database
      const guildConfigs = await db.getAllGuildConfigs()
      if (guildConfigs.length > 0) {
        console.log(`Loaded ${guildConfigs.length} guild configurations from database`)

        // Store in memory for quick access
        guildConfigs.forEach((guildConfig) => {
          config.guilds[guildConfig.guildId] = guildConfig
        })
      } else {
        console.log("No guild configurations found in database")
      }
    } catch (error) {
      console.error("Failed to connect to MongoDB:", error)
      console.log("Falling back to in-memory configuration")
    }
  } else {
    console.log("Database is disabled. Using in-memory configuration.")
  }

  // After loading guild configs, update the global prefix if any guild has a custom one
  if (useDatabase && Object.keys(config.guilds).length > 0) {
    // For simplicity, we'll use the first guild's prefix if it has one
    const firstGuildId = Object.keys(config.guilds)[0]
    if (config.guilds[firstGuildId] && config.guilds[firstGuildId].prefix) {
      console.log(`Using prefix from guild ${firstGuildId}: ${config.guilds[firstGuildId].prefix}`)
      config.prefix = config.guilds[firstGuildId].prefix
    }
  }

  // Initialize guild configs
  if (!config.guilds) {
    config.guilds = {}
  }

  // Set up rate limits
  setupRateLimits()
  console.log("Rate limiting initialized")

  // Set up interval checks for events
  if (config.events && config.events.milestones && config.events.milestones.enabled) {
    setInterval(() => checkMilestones(client), 3600000) // Check every hour
  }

  if (config.events && config.events.anniversaries && config.events.anniversaries.enabled) {
    setInterval(() => checkAnniversaries(client), 86400000) // Check every day
  }
})

// Handle slash commands
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return

  const command = client.slashCommands.get(interaction.commandName)

  if (!command) {
    console.log(`No command matching ${interaction.commandName} was found.`)
    return
  }

  try {
    // Check for rate limiting
    const rateLimitResult = await isRateLimited(interaction.commandName, interaction.user.id, {
      ip: interaction.user.id, // Using user ID as IP for protection
      userAgent: "Discord Bot",
      country: "unknown",
    })

    if (rateLimitResult.limited) {
      return interaction.reply({
        content: `You're using this command too frequently. Please try again in ${Math.ceil((rateLimitResult.reset - Date.now()) / 1000)} seconds.`,
        ephemeral: true,
      })
    }

    await command.execute(interaction, client)
  } catch (error) {
    console.error(`Error executing command ${interaction.commandName}:`, error)

    // Reply to the user if we haven't already
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "There was an error executing this command!",
        ephemeral: true,
      })
    } else {
      await interaction.reply({
        content: "There was an error executing this command!",
        ephemeral: true,
      })
    }
  }
})

// Handle prefix commands
client.on(Events.MessageCreate, async (message) => {
  // Ignore messages from bots
  if (message.author.bot) return

  // Get the guild ID
  const guildId = message.guild ? message.guild.id : null

  // Determine which prefix to use
  let prefix = config.prefix // Default prefix

  // Check if there's a guild-specific prefix
  if (guildId && config.guilds[guildId] && config.guilds[guildId].prefix) {
    prefix = config.guilds[guildId].prefix
  }

  // Ignore messages that don't start with the prefix
  if (!message.content.startsWith(prefix)) return

  // Check if prefix commands are enabled
  if (!config.enablePrefix) {
    // Only respond if the message is from a guild admin
    if (message.member && message.member.permissions.has("Administrator")) {
      return message.reply(
        "Prefix commands are currently disabled. Use slash commands instead or enable prefix commands in the config.",
      )
    }
    return
  }

  // Parse the command and arguments
  const args = message.content.slice(prefix.length).trim().split(/ +/)
  const commandName = args.shift().toLowerCase()

  // Find the command
  const command = client.commands.get(commandName)
  if (!command) return

  try {
    // Check for rate limiting
    const rateLimitResult = await isRateLimited(commandName, message.author.id, {
      ip: message.author.id, // Using user ID as IP for protection
      userAgent: "Discord Bot",
      country: "unknown",
    })

    if (rateLimitResult.limited) {
      return message.reply(
        `You're using this command too frequently. Please try again in ${Math.ceil((rateLimitResult.reset - Date.now()) / 1000)} seconds.`,
      )
    }

    // Execute the command with the message as the interaction
    await command.execute(message, client)
  } catch (error) {
    console.error(`Error executing prefix command ${commandName}:`, error)
    message.reply("There was an error executing this command!")
  }
})

// Welcome message handler
client.on(Events.GuildMemberAdd, async (member) => {
  const guildId = member.guild.id

  // Get guild config from database if enabled
  let guildConfig
  const useDatabase = process.env.USE_DATABASE === "true"

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

  // Initialize guild config if it doesn't exist
  if (!guildConfig) {
    guildConfig = {
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

    // Store in memory
    config.guilds[guildId] = guildConfig

    // Save to database if enabled
    if (useDatabase) {
      try {
        await db.saveGuildConfig(guildId, guildConfig)
      } catch (error) {
        console.error(`Error saving guild config to database for ${guildId}:`, error)
      }
    }
  }

  const welcomeConfig = guildConfig.welcome || { enabled: false }

  if (!welcomeConfig.enabled) return

  // Log the event if logging is enabled
  if (config.logging && config.logging.enabled && config.logging.events.memberJoin) {
    logEvent(client, "memberJoin", member)
  }

  // Auto-assign roles if enabled
  if (
    guildConfig.roles &&
    guildConfig.roles.enabled &&
    guildConfig.roles.autoAssign &&
    guildConfig.roles.autoAssign.length > 0
  ) {
    try {
      for (const roleId of guildConfig.roles.autoAssign) {
        const role = member.guild.roles.cache.get(roleId)
        if (role) {
          await member.roles.add(role)
          console.log(`Added role ${role.name} to ${member.user.tag}`)
        }
      }
    } catch (error) {
      console.error("Error assigning roles:", error)
    }
  }

  // Send welcome messages to all configured channels
  if (welcomeConfig.channels && welcomeConfig.channels.length > 0) {
    console.log(`Found ${welcomeConfig.channels.length} welcome channels for guild ${member.guild.name}`)

    // Add this check to ensure leave channels are properly initialized
    if (!guildConfig.leave || !guildConfig.leave.channels) {
      console.log(`Initializing leave channels array for guild ${member.guild.name}`)
      if (!guildConfig.leave) {
        guildConfig.leave = {
          enabled: true,
          channels: [],
          defaultMode: "embed",
          embed: { ...config.defaultLeaveEmbed },
          text: config.defaultLeaveText,
        }
      } else if (!guildConfig.leave.channels) {
        guildConfig.leave.channels = []
      }

      // Save the updated config to database if enabled
      if (process.env.USE_DATABASE === "true") {
        try {
          await db.saveGuildConfig(guildId, guildConfig)
          console.log(`Saved initialized leave config to database for guild ${guildId}`)
        } catch (error) {
          console.error(`Error saving initialized leave config to database for ${guildId}:`, error)
        }
      }
    }

    for (const channelConfig of welcomeConfig.channels) {
      const welcomeChannel = member.guild.channels.cache.get(channelConfig.id)
      if (!welcomeChannel) {
        console.log(`Welcome channel ${channelConfig.id} not found`)
        continue
      }

      console.log(`Attempting to send welcome message to channel: ${welcomeChannel.name} (${welcomeChannel.id})`)

      // Check if the bot has permission to send messages in this channel
      const permissions = welcomeChannel.permissionsFor(member.guild.members.me)
      if (!permissions || !permissions.has("SendMessages")) {
        console.log(`Bot doesn't have permission to send messages in ${welcomeChannel.name}`)
        continue
      }

      const mode = channelConfig.mode || welcomeConfig.defaultMode || "embed"

      if (mode === "embed") {
        try {
          // Create welcome embed with channel-specific settings if available
          const result = await createWelcomeEmbed(member, channelConfig.settings, guildId)

          if (result.attachment) {
            // If we have an attachment (Canvas image), send it with the embed
            await welcomeChannel.send({ embeds: [result.embed], files: [result.attachment] })
            console.log(`Sent welcome embed with attachment to ${welcomeChannel.name} for ${member.user.tag}`)
          } else {
            // Otherwise just send the embed
            await welcomeChannel.send({ embeds: [result.embed] })
            console.log(`Sent welcome embed to ${welcomeChannel.name} for ${member.user.tag}`)
          }
        } catch (error) {
          console.error(`Error sending welcome embed to ${welcomeChannel.name}:`, error)
        }
      } else {
        try {
          // Send text welcome message
          const result = await formatWelcomeText(member, channelConfig.settings, guildId)

          if (result.attachment) {
            // If we have an attachment (Canvas image or custom image), send it with the text
            await welcomeChannel.send({ content: result.text, files: [result.attachment] })
            console.log(`Sent welcome text with attachment to ${welcomeChannel.name} for ${member.user.tag}`)
          } else {
            // Otherwise just send the text
            await welcomeChannel.send(result.text)
            console.log(`Sent welcome text to ${welcomeChannel.name} for ${member.user.tag}`)
          }
        } catch (error) {
          console.error(`Error sending welcome text to ${welcomeChannel.name}:`, error)
        }
      }
    }
  } else {
    console.log(
      `No welcome channels configured for guild ${member.guild.name}. Adding a channel with /welcome channel add #channel`,
    )
  }

  // Check for milestones
  if (config.events && config.events.milestones && config.events.milestones.enabled) {
    checkMilestones(client, member.guild)
  }
})

// Leave message handler
client.on(Events.GuildMemberRemove, async (member) => {
  const guildId = member.guild.id
  const useDatabase = process.env.USE_DATABASE === "true"

  console.log(`Member left: ${member.user.tag} from guild ${member.guild.name} (${guildId})`)

  // Get guild config from database if enabled
  let guildConfig
  if (useDatabase) {
    try {
      guildConfig = await db.getGuildConfig(guildId)
      console.log(`Retrieved guild config from database for ${guildId}`)
    } catch (error) {
      console.error(`Error getting guild config from database for ${guildId}:`, error)
      // Fall back to in-memory config
      guildConfig = config.guilds[guildId]
      console.log(`Falling back to in-memory config for ${guildId}`)
    }
  } else {
    // Use in-memory config
    guildConfig = config.guilds[guildId]
    console.log(`Using in-memory config for ${guildId}`)
  }

  // Initialize guild config if it doesn't exist
  if (!guildConfig) {
    console.log(`No guild config found for ${guildId}, creating default config`)
    guildConfig = {
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

    // Store in memory
    config.guilds[guildId] = guildConfig
    console.log(`Stored default config in memory for ${guildId}`)

    // Save to database if enabled
    if (useDatabase) {
      try {
        await db.saveGuildConfig(guildId, guildConfig)
        console.log(`Saved default config to database for ${guildId}`)
      } catch (error) {
        console.error(`Error saving guild config to database for ${guildId}:`, error)
      }
    }
  }

  // Ensure leave config exists
  if (!guildConfig.leave) {
    console.log(`No leave config found for ${guildId}, creating default leave config`)
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
    console.log(`Initializing leave channels array for guild ${guildId}`)
    guildConfig.leave.channels = []

    // Save the updated config to database if enabled
    if (useDatabase) {
      try {
        await db.saveGuildConfig(guildId, guildConfig)
        console.log(`Saved initialized leave channels array to database for guild ${guildId}`)
      } catch (error) {
        console.error(`Error saving initialized leave channels to database for ${guildId}:`, error)
      }
    }
  }

  const leaveConfig = guildConfig.leave
  console.log(`Leave config for ${guildId}:`, JSON.stringify(leaveConfig))

  if (!leaveConfig.enabled) {
    console.log(`Leave messages are disabled for guild ${member.guild.name}`)
    return
  }

  // Log the event if logging is enabled
  if (config.logging && config.logging.enabled && config.logging.events.memberLeave) {
    logEvent(client, "memberLeave", member)
  }

  // Send leave messages to all configured channels
  if (leaveConfig.channels && leaveConfig.channels.length > 0) {
    console.log(`Found ${leaveConfig.channels.length} leave channels for guild ${member.guild.name}`)

    for (const channelConfig of leaveConfig.channels) {
      console.log(`Processing leave channel config:`, JSON.stringify(channelConfig))

      const leaveChannel = member.guild.channels.cache.get(channelConfig.id)
      if (!leaveChannel) {
        console.log(`Leave channel ${channelConfig.id} not found`)
        continue
      }

      console.log(`Attempting to send leave message to channel: ${leaveChannel.name} (${leaveChannel.id})`)

      // Check if the bot has permission to send messages in this channel
      const permissions = leaveChannel.permissionsFor(member.guild.members.me)
      if (!permissions || !permissions.has("SendMessages")) {
        console.log(`Bot doesn't have permission to send messages in ${leaveChannel.name}`)
        continue
      }

      const mode = channelConfig.mode || leaveConfig.defaultMode || "embed"
      console.log(`Using ${mode} mode for leave message in ${leaveChannel.name}`)

      if (mode === "embed") {
        try {
          // Create leave embed with channel-specific settings if available
          const result = await createLeaveEmbed(member, channelConfig.settings, guildId)

          if (result.attachment) {
            // If we have an attachment (Canvas image), send it with the embed
            await leaveChannel.send({ embeds: [result.embed], files: [result.attachment] })
            console.log(`Sent leave embed with attachment to ${leaveChannel.name} for ${member.user.tag}`)
          } else {
            // Otherwise just send the embed
            await leaveChannel.send({ embeds: [result.embed] })
            console.log(`Sent leave embed to ${leaveChannel.name} for ${member.user.tag}`)
          }
        } catch (error) {
          console.error(`Error sending leave embed to ${leaveChannel.name}:`, error)
        }
      } else {
        try {
          // Send text leave message
          const result = await formatLeaveText(member, channelConfig.settings, guildId)

          if (result.attachment) {
            // If we have an attachment (Canvas image or custom image), send it with the text
            await leaveChannel.send({ content: result.text, files: [result.attachment] })
            console.log(`Sent leave text with attachment to ${leaveChannel.name} for ${member.user.tag}`)
          } else {
            // Otherwise just send the text
            await leaveChannel.send(result.text)
            console.log(`Sent leave text to ${leaveChannel.name} for ${member.user.tag}`)
          }
        } catch (error) {
          console.error(`Error sending leave text to ${leaveChannel.name}:`, error)
        }
      }
    }
  } else {
    console.log(
      `No leave channels configured for guild ${member.guild.name}. Use /leave channel add #channel to configure.`,
    )
  }
})

// Ban event handler
client.on(Events.GuildBanAdd, (ban) => {
  if (config.logging && config.logging.enabled && config.logging.events.memberBan) {
    logEvent(client, "memberBan", ban)
  }
})

// Unban event handler
client.on(Events.GuildBanRemove, (ban) => {
  if (config.logging && config.logging.enabled && config.logging.events.memberUnban) {
    logEvent(client, "memberUnban", ban)
  }
})

// Role change event handler
client.on(Events.GuildMemberUpdate, (oldMember, newMember) => {
  if (config.logging && config.logging.enabled && config.logging.events.memberRoleChange) {
    // Check if roles have changed
    if (oldMember.roles.cache.size !== newMember.roles.cache.size) {
      logEvent(client, "memberRoleChange", { oldMember, newMember })
    }
  }
})

// Error handling
client.on("error", (error) => {
  console.error("Discord client error:", error)
})

process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error)
})

// Login to Discord with your client's token
const token = process.env.DISCORD_BOT_TOKEN || config.token
if (!token) {
  console.error("No token provided! Make sure to set DISCORD_BOT_TOKEN in your environment variables or config.js")
  process.exit(1)
}

client.login(token).catch((error) => {
  console.error("Failed to login:", error)
  process.exit(1)
})

// Add the "made with <3 by unt1tle" message to the console output
console.log("Bot is starting...")
console.log("\x1b[35m%s\x1b[0m", "Made with <3 by unt1tle")

