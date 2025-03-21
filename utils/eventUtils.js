// Event utility functions
const config = require("../config")
const { EmbedBuilder } = require("discord.js")
const { isAnniversary } = require("./dateUtils")
const { replaceVariables } = require("./messageUtils")

// Check for member count milestones
function checkMilestones(client, guild = null) {
  if (!config.events || !config.events.milestones || !config.events.milestones.enabled) {
    return
  }

  // If no guild is provided, check all guilds
  const guilds = guild ? [guild] : client.guilds.cache.values()

  for (const g of guilds) {
    const memberCount = g.memberCount
    const milestoneChannel = g.channels.cache.get(config.events.milestones.channel)

    if (!milestoneChannel) continue

    // Check if the current member count matches any milestone
    for (const milestone of config.events.milestones.intervals) {
      if (memberCount === milestone) {
        // Send milestone announcement
        const message = config.events.milestones.message.replace("{count}", memberCount)

        const embed = new EmbedBuilder()
          .setColor("#FFD700") // Gold color for milestones
          .setTitle(`🎉 Member Milestone Reached!`)
          .setDescription(message)
          .setTimestamp()

        milestoneChannel.send({ embeds: [embed] })
        break
      }
    }
  }
}

// Check for member anniversaries
async function checkAnniversaries(client) {
  if (!config.events || !config.events.anniversaries || !config.events.anniversaries.enabled) {
    return
  }

  // Check all guilds
  for (const guild of client.guilds.cache.values()) {
    const anniversaryChannel = guild.channels.cache.get(config.events.anniversaries.channel)
    if (!anniversaryChannel) continue

    // Fetch all members (this might be rate-limited for large servers)
    try {
      const members = await guild.members.fetch()

      for (const [memberId, member] of members) {
        // Skip bots
        if (member.user.bot) continue

        // Check if today is an anniversary for this member
        const anniversaryCheck = isAnniversary(member.joinedAt, new Date(), config.events.anniversaries.intervals)

        if (anniversaryCheck.isAnniversary) {
          // Create a member object with necessary properties for variable replacement
          const memberObj = {
            user: member.user,
            id: member.id,
            guild: guild,
            joinedAt: member.joinedAt,
          }

          // Send anniversary announcement
          const message = replaceVariables(
            config.events.anniversaries.message.replace("{duration}", anniversaryCheck.days),
            memberObj,
          )

          const embed = new EmbedBuilder()
            .setColor("#9B59B6") // Purple color for anniversaries
            .setTitle(`🎂 Member Anniversary!`)
            .setDescription(message)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setTimestamp()

          anniversaryChannel.send({ embeds: [embed] })
        }
      }
    } catch (error) {
      console.error(`Error checking anniversaries for guild ${guild.name}:`, error)
    }
  }
}

module.exports = {
  checkMilestones,
  checkAnniversaries,
}

