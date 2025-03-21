// Logging utility functions
const { EmbedBuilder } = require("discord.js")
const config = require("../config")
const { formatDate, calculateDuration } = require("./dateUtils")

// Log an event to the configured logging channel
function logEvent(client, eventType, data) {
  if (!config.logging || !config.logging.enabled) return

  const guild = getGuildFromData(data)
  if (!guild) return

  const logChannel = guild.channels.cache.get(config.logging.channel)
  if (!logChannel) return

  const logEmbed = createLogEmbed(eventType, data)
  logChannel.send({ embeds: [logEmbed] })
}

// Get the guild object from various data structures
function getGuildFromData(data) {
  if (data.guild) return data.guild
  if (data.member && data.member.guild) return data.member.guild
  if (data.oldMember && data.oldMember.guild) return data.oldMember.guild
  if (data.newMember && data.newMember.guild) return data.newMember.guild
  return null
}

// Create a log embed based on the event type
function createLogEmbed(eventType, data) {
  const embed = new EmbedBuilder().setTimestamp()

  switch (eventType) {
    case "memberJoin":
      embed
        .setColor("#43B581") // Green
        .setTitle("Member Joined")
        .setDescription(`<@${data.id}> (${data.user.tag}) joined the server.`)
        .setThumbnail(data.user.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: "User ID", value: data.id, inline: true },
          { name: "Account Created", value: formatDate(data.user.createdAt), inline: true },
          { name: "Account Age", value: calculateDuration(data.user.createdAt), inline: true },
        )
      break

    case "memberLeave":
      embed
        .setColor("#F04747") // Red
        .setTitle("Member Left")
        .setDescription(`${data.user.tag} left the server.`)
        .setThumbnail(data.user.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: "User ID", value: data.id, inline: true },
          { name: "Joined At", value: formatDate(data.joinedAt), inline: true },
          { name: "Time in Server", value: calculateDuration(data.joinedAt), inline: true },
        )
      break

    case "memberBan":
      embed
        .setColor("#F04747") // Red
        .setTitle("Member Banned")
        .setDescription(`${data.user.tag} was banned from the server.`)
        .setThumbnail(data.user.displayAvatarURL({ dynamic: true }))
        .addFields({ name: "User ID", value: data.user.id, inline: true })
      break

    case "memberUnban":
      embed
        .setColor("#43B581") // Green
        .setTitle("Member Unbanned")
        .setDescription(`${data.user.tag} was unbanned from the server.`)
        .setThumbnail(data.user.displayAvatarURL({ dynamic: true }))
        .addFields({ name: "User ID", value: data.user.id, inline: true })
      break

    case "memberRoleChange":
      const { oldMember, newMember } = data
      const addedRoles = newMember.roles.cache.filter((role) => !oldMember.roles.cache.has(role.id))
      const removedRoles = oldMember.roles.cache.filter((role) => !newMember.roles.cache.has(role.id))

      const roleChangeDescription = `Roles changed for ${newMember.user.tag}`
      const roleFields = []

      if (addedRoles.size > 0) {
        roleFields.push({
          name: "Added Roles",
          value: addedRoles.map((r) => `<@&${r.id}>`).join(", ") || "None",
          inline: false,
        })
      }

      if (removedRoles.size > 0) {
        roleFields.push({
          name: "Removed Roles",
          value: removedRoles.map((r) => `<@&${r.id}>`).join(", ") || "None",
          inline: false,
        })
      }

      embed
        .setColor("#FAA61A") // Orange
        .setTitle("Member Roles Updated")
        .setDescription(roleChangeDescription)
        .setThumbnail(newMember.user.displayAvatarURL({ dynamic: true }))
        .addFields({ name: "User ID", value: newMember.id, inline: true }, ...roleFields)
      break

    default:
      embed
        .setColor("#99AAB5") // Grey
        .setTitle("Unknown Event")
        .setDescription("An unknown event occurred.")
  }

  return embed
}

module.exports = {
  logEvent,
}

