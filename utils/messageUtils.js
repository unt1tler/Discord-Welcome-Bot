// Utility functions for creating messages
const { EmbedBuilder, AttachmentBuilder } = require("discord.js")
const config = require("../config")
const { formatDate, calculateDuration } = require("./dateUtils")
const { createWelcomeCard, createLeaveCard, isCanvasAvailable } = require("./canvasUtils")

// Create welcome embed
async function createWelcomeEmbed(member, channelSettings = {}, guildId = null) {
  // Get the appropriate config based on guild ID
  let welcomeConfig = {}

  if (guildId && config.guilds && config.guilds[guildId] && config.guilds[guildId].welcome) {
    // Use guild-specific config if available
    welcomeConfig = {
      ...config.defaultWelcomeEmbed,
      ...config.guilds[guildId].welcome.embed,
      ...(channelSettings && channelSettings.embed ? channelSettings.embed : {}),
    }
  } else {
    // Fall back to default config
    welcomeConfig = {
      ...config.defaultWelcomeEmbed,
      ...(channelSettings && channelSettings.embed ? channelSettings.embed : {}),
    }
  }

  const embed = new EmbedBuilder()
    .setColor(welcomeConfig.color || "#43B581")
    .setTitle(welcomeConfig.title || "Welcome to the Server!")
    .setDescription(
      replaceVariables(welcomeConfig.description || "Hey {user}, welcome to our awesome community!", member),
    )

  // Set author if configured
  if (welcomeConfig.author) {
    const authorName = replaceVariables(welcomeConfig.author.name, member)
    let authorIcon = welcomeConfig.author.icon

    if (authorIcon === "server") {
      authorIcon = member.guild.iconURL({ dynamic: true })
    }

    embed.setAuthor({ name: authorName, iconURL: authorIcon || null })
  }

  // Set timestamp if enabled
  if (welcomeConfig.showTimestamp) {
    embed.setTimestamp()
  }

  // Check if using canvas for image and if canvas is available
  if (welcomeConfig.useCanvas && isCanvasAvailable) {
    try {
      // Generate welcome card using canvas
      const cardBuffer = await createWelcomeCard(member, welcomeConfig.canvasOptions || {})

      if (cardBuffer) {
        const attachment = new AttachmentBuilder(cardBuffer, { name: "welcome-card.png" })
        embed.setImage("attachment://welcome-card.png")

        // Return both embed and attachment
        return { embed, attachment }
      }
    } catch (error) {
      console.error("Error creating welcome card:", error)
      // If canvas fails, fall back to regular image if specified
      if (welcomeConfig.image) {
        embed.setImage(welcomeConfig.image)
      }
    }
  } else if (welcomeConfig.image) {
    // Use regular image if specified
    embed.setImage(welcomeConfig.image)
  }

  // Set thumbnail
  if (welcomeConfig.thumbnail === "user") {
    embed.setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
  } else if (welcomeConfig.thumbnail) {
    embed.setThumbnail(welcomeConfig.thumbnail)
  }

  // Add fields if configured
  if (welcomeConfig.fields && welcomeConfig.fields.length > 0) {
    for (const field of welcomeConfig.fields) {
      embed.addFields({
        name: replaceVariables(field.name, member),
        value: replaceVariables(field.value, member),
        inline: field.inline || false,
      })
    }
  }

  // Set footer if configured
  if (welcomeConfig.footer) {
    const footerText = replaceVariables(welcomeConfig.footer.text || "You are member #{count}", member)
    embed.setFooter({
      text: footerText,
      iconURL: welcomeConfig.footer.icon || null,
    })
  }

  return { embed }
}

// Create leave embed
async function createLeaveEmbed(member, channelSettings = {}, guildId = null) {
  // Get the appropriate config based on guild ID
  let leaveConfig = {}

  if (guildId && config.guilds && config.guilds[guildId] && config.guilds[guildId].leave) {
    // Use guild-specific config if available
    leaveConfig = {
      ...config.defaultLeaveEmbed,
      ...config.guilds[guildId].leave.embed,
      ...(channelSettings && channelSettings.embed ? channelSettings.embed : {}),
    }
  } else {
    // Fall back to default config
    leaveConfig = {
      ...config.defaultLeaveEmbed,
      ...(channelSettings && channelSettings.embed ? channelSettings.embed : {}),
    }
  }

  const embed = new EmbedBuilder()
    .setColor(leaveConfig.color || "#F04747")
    .setTitle(leaveConfig.title || "User Left the Server")
    .setDescription(replaceVariables(leaveConfig.description || "{user} has left our community.", member))

  // Set author if configured
  if (leaveConfig.author) {
    const authorName = replaceVariables(leaveConfig.author.name, member)
    let authorIcon = leaveConfig.author.icon

    if (authorIcon === "server") {
      authorIcon = member.guild.iconURL({ dynamic: true })
    }

    embed.setAuthor({ name: authorName, iconURL: authorIcon || null })
  }

  // Set timestamp if enabled
  if (leaveConfig.showTimestamp) {
    embed.setTimestamp()
  }

  // Check if using canvas for image and if canvas is available
  if (leaveConfig.useCanvas && isCanvasAvailable) {
    try {
      // Generate leave card using canvas
      const cardBuffer = await createLeaveCard(member, leaveConfig.canvasOptions || {})

      if (cardBuffer) {
        const attachment = new AttachmentBuilder(cardBuffer, { name: "leave-card.png" })
        embed.setImage("attachment://leave-card.png")

        // Return both embed and attachment
        return { embed, attachment }
      }
    } catch (error) {
      console.error("Error creating leave card:", error)
      // If canvas fails, fall back to regular image if specified
      if (leaveConfig.image) {
        embed.setImage(leaveConfig.image)
      }
    }
  } else if (leaveConfig.image) {
    // Use regular image if specified
    embed.setImage(leaveConfig.image)
  }

  // Set thumbnail
  if (leaveConfig.thumbnail === "user") {
    embed.setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
  } else if (leaveConfig.thumbnail) {
    embed.setThumbnail(leaveConfig.thumbnail)
  }

  // Add fields if configured
  if (leaveConfig.fields && leaveConfig.fields.length > 0) {
    for (const field of leaveConfig.fields) {
      embed.addFields({
        name: replaceVariables(field.name, member),
        value: replaceVariables(field.value, member),
        inline: field.inline || false,
      })
    }
  }

  // Set footer if configured
  if (leaveConfig.footer) {
    const footerText = replaceVariables(leaveConfig.footer.text || "They were with us for {duration}", member)
    embed.setFooter({
      text: footerText,
      iconURL: leaveConfig.footer.icon || null,
    })
  }

  return { embed }
}

// Format welcome text message
async function formatWelcomeText(member, channelSettings = {}, guildId = null) {
  // Get the appropriate config
  let welcomeConfig = {}
  let textTemplate = config.defaultWelcomeText
  let imageUrl = null

  if (guildId && config.guilds && config.guilds[guildId] && config.guilds[guildId].welcome) {
    welcomeConfig = config.guilds[guildId].welcome
    textTemplate = welcomeConfig.text || textTemplate

    // Get image from config
    if (welcomeConfig.textImage) {
      imageUrl = welcomeConfig.textImage
    } else if (welcomeConfig.embed && welcomeConfig.embed.image) {
      // Fall back to embed image if available
      imageUrl = welcomeConfig.embed.image
    }
  }

  // Get text template from channel settings if available
  if (channelSettings && channelSettings.text) {
    textTemplate = channelSettings.text
  }

  // Check if using canvas image with text mode and if canvas is available
  let attachment = null
  if (welcomeConfig.useCanvasWithText && isCanvasAvailable) {
    try {
      const cardBuffer = await createWelcomeCard(member, welcomeConfig.canvasOptions || {})
      if (cardBuffer) {
        attachment = new AttachmentBuilder(cardBuffer, { name: "welcome-card.png" })
      }
    } catch (error) {
      console.error("Error creating welcome card for text mode:", error)
    }
  } else if (imageUrl) {
    // Use the custom image URL if available
    try {
      attachment = new AttachmentBuilder(imageUrl, { name: "welcome-image.png" })
    } catch (error) {
      console.error("Error creating attachment from image URL:", error)
    }
  }

  return {
    text: replaceVariables(textTemplate, member),
    attachment,
  }
}

// Format leave text message
async function formatLeaveText(member, channelSettings = {}, guildId = null) {
  // Get the appropriate config
  let leaveConfig = {}
  let textTemplate = config.defaultLeaveText
  let imageUrl = null

  if (guildId && config.guilds && config.guilds[guildId] && config.guilds[guildId].leave) {
    leaveConfig = config.guilds[guildId].leave
    textTemplate = leaveConfig.text || textTemplate

    // Get image from config
    if (leaveConfig.textImage) {
      imageUrl = leaveConfig.textImage
    } else if (leaveConfig.embed && leaveConfig.embed.image) {
      // Fall back to embed image if available
      imageUrl = leaveConfig.embed.image
    }
  }

  // Get text template from channel settings if available
  if (channelSettings && channelSettings.text) {
    textTemplate = channelSettings.text
  }

  // Check if using canvas image with text mode and if canvas is available
  let attachment = null
  if (leaveConfig.useCanvasWithText && isCanvasAvailable) {
    try {
      const cardBuffer = await createLeaveCard(member, leaveConfig.canvasOptions || {})
      if (cardBuffer) {
        attachment = new AttachmentBuilder(cardBuffer, { name: "leave-card.png" })
      }
    } catch (error) {
      console.error("Error creating leave card for text mode:", error)
    }
  } else if (imageUrl) {
    // Use the custom image URL if available
    try {
      attachment = new AttachmentBuilder(imageUrl, { name: "leave-image.png" })
    } catch (error) {
      console.error("Error creating attachment from image URL:", error)
    }
  }

  return {
    text: replaceVariables(textTemplate, member),
    attachment,
  }
}

// Replace variables in a string with actual values
function replaceVariables(text, member) {
  if (!text) return ""

  const joinDate = member.joinedAt || new Date()
  const leaveDate = new Date()
  const durationDays = Math.floor((leaveDate - joinDate) / (1000 * 60 * 60 * 24))
  const memberCount = member.guild.memberCount

  return text
    .replace(/{user}/g, member.user.tag)
    .replace(/{usermention}/g, `<@${member.id}>`)
    .replace(/{userid}/g, member.id)
    .replace(/{username}/g, member.user.username)
    .replace(/{userdiscriminator}/g, member.user.discriminator || "0")
    .replace(/{server}/g, member.guild.name)
    .replace(/{serverid}/g, member.guild.id)
    .replace(/{count}/g, memberCount)
    .replace(/{joindate}/g, formatDate(joinDate))
    .replace(/{duration}/g, calculateDuration(joinDate, leaveDate))
    .replace(/{avatar}/g, member.user.displayAvatarURL({ dynamic: true }))
    .replace(/{servericon}/g, member.guild.iconURL({ dynamic: true }) || "")
}

module.exports = {
  createWelcomeEmbed,
  createLeaveEmbed,
  formatWelcomeText,
  formatLeaveText,
  replaceVariables,
}

