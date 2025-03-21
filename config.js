// Configuration file for the Discord Welcome & Leave Bot
module.exports = {
  // Bot Configuration
  token: process.env.DISCORD_BOT_TOKEN || "",
  clientId: process.env.DISCORD_CLIENT_ID || "",
  guildId: process.env.DISCORD_GUILD_ID || "", // For slash command registration

  // Database Configuration
  database: {
    enabled: process.env.USE_DATABASE === "true" || false,
    uri: process.env.MONGODB_URI || "mongodb://localhost:27017/discordbot",
    dbName: process.env.MONGODB_DB_NAME || "discordbot",
  },

  // Command Settings
  prefix: "!",
  enablePrefix: true,

  // Multi-guild configuration storage
  guilds: {},

  // Default templates for new guilds
  defaultWelcomeEmbed: {
    color: "#43B581",
    title: "Welcome to the Server!",
    description: "Hey {user}, welcome to our awesome community!",
    showTimestamp: true,
    thumbnail: "user",
    footer: {
      text: "You are member #{count}",
    },
  },

  defaultLeaveEmbed: {
    color: "#F04747",
    title: "User Left the Server",
    description: "{user} has left our community.",
    showTimestamp: true,
    thumbnail: "user",
    footer: {
      text: "They were with us for {duration}",
    },
  },

  // Default canvas settings
  defaultCanvasOptions: {
    welcome: {
      gradientStart: "#5865F2",
      gradientEnd: "#4752C4",
      backgroundColor: "#23272a",
      textColor: "#ffffff",
    },
    leave: {
      gradientStart: "#F04747",
      gradientEnd: "#B52E31",
      backgroundColor: "#23272a",
      textColor: "#ffffff",
    },
  },

  // Default text templates
  defaultWelcomeText: "🎉 {user} just joined the server! Welcome to our community! You are member #{count}.",
  defaultLeaveText: "👋 {user} has left the server. They were with us for {duration}.",
}

