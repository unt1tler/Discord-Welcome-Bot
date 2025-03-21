const { Events } = require("discord.js")
const { MongoClient } = require("mongodb")
const { createWelcomeEmbed, formatWelcomeText } = require("../utils/messageUtils")
const { createCanvas, loadImage } = require("canvas")
const { createWelcomeCard } = require("../utils/canvasUtils")
const { recordMemberJoin } = require("../utils/database")
const { sendWelcomeMessage } = require("../utils/messageUtils")

module.exports = {
  name: Events.GuildMemberAdd,
  once: false,
  async execute(member) {
    const { guild } = member

    try {
      console.log(`New member joined: ${member.user.tag} in ${member.guild.name}`)

      // Record the join in the database
      if (process.env.USE_DATABASE === "true") {
        await recordMemberJoin(member.guild.id, member.user.id)
        console.log(`Recorded join for ${member.user.tag} in database`)
      }

      // Send welcome message
      await sendWelcomeMessage(member)

      // Connect to MongoDB
      let client = null // Declare client variable
      let guildConfig

      if (process.env.MONGODB_URI) {
        client = new MongoClient(process.env.MONGODB_URI)
        await client.connect()

        const db = client.db(process.env.MONGODB_DB_NAME || "discordbot")
        const collection = db.collection("guildConfigs")

        // Get guild configuration
        guildConfig = await collection.findOne({ guildId: guild.id })
      }

      // Handle auto-role assignment
      if (
        guildConfig?.roles?.enabled &&
        Array.isArray(guildConfig.roles.autoAssign) &&
        guildConfig.roles.autoAssign.length > 0
      ) {
        try {
          // Get the roles to assign
          const rolesToAssign = guildConfig.roles.autoAssign
            .map((roleId) => guild.roles.cache.get(roleId))
            .filter((role) => role !== undefined)

          if (rolesToAssign.length > 0) {
            // Add roles to the member
            await member.roles.add(rolesToAssign)
            console.log(`Auto-assigned ${rolesToAssign.length} roles to ${member.user.tag} in ${guild.name}`)
          }
        } catch (roleError) {
          console.error(`Error assigning auto-roles to ${member.user.tag} in ${guild.name}:`, roleError)
        }
      }

      // Handle welcome message
      if (
        guildConfig?.welcome?.enabled &&
        Array.isArray(guildConfig.welcome.channels) &&
        guildConfig.welcome.channels.length > 0
      ) {
        // Get member count for the welcome message
        const memberCount = guild.memberCount

        // Send welcome message to all configured channels
        for (const channelId of guildConfig.welcome.channels) {
          const channel = await guild.channels.fetch(channelId).catch(() => null)

          if (channel && channel.isTextBased()) {
            try {
              if (guildConfig.welcome.mode === "embed") {
                // Create and send embed
                const embed = createWelcomeEmbed(member, memberCount, guildConfig.welcome.embed)

                // Check if we need to attach an image
                if (guildConfig.welcome.embed.image) {
                  await channel.send({ embeds: [embed] })
                } else {
                  // Create welcome card
                  const welcomeCard = await createWelcomeCard(member, memberCount, guild.name)

                  await channel.send({
                    embeds: [embed],
                    files: [{ attachment: welcomeCard, name: "welcome.png" }],
                  })
                }
              } else {
                // Format and send text message
                const welcomeText = formatWelcomeText(member, memberCount, guildConfig.welcome.text)

                // Check if we need to attach an image
                if (guildConfig.welcome.image) {
                  await channel.send({
                    content: welcomeText,
                    files: [{ attachment: guildConfig.welcome.image, name: "welcome-image.png" }],
                  })
                } else {
                  // Create welcome card
                  const welcomeCard = await createWelcomeCard(member, memberCount, guild.name)

                  await channel.send({
                    content: welcomeText,
                    files: [{ attachment: welcomeCard, name: "welcome.png" }],
                  })
                }
              }

              console.log(`Sent welcome message for ${member.user.tag} in ${guild.name}`)
            } catch (messageError) {
              console.error(`Error sending welcome message in ${guild.name}:`, messageError)
            }
          }
        }
      }

      // Update join statistics
      if (process.env.MONGODB_URI && client) {
        try {
          const db = client.db(process.env.MONGODB_DB_NAME || "discordbot")
          const statsCollection = db.collection("guildStats")

          const now = new Date()
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
          const thisWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).toISOString()
          const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

          // Get existing stats
          const existingStats = await statsCollection.findOne({ guildId: guild.id })

          // Initialize stats object if it doesn't exist
          const stats = existingStats?.stats || {
            joins: { today: 0, week: 0, month: 0, total: 0 },
            leaves: { today: 0, week: 0, month: 0, total: 0 },
            joinHistory: [],
            leaveHistory: [],
          }

          // Reset counters if needed
          const lastUpdate = existingStats?.lastUpdate ? new Date(existingStats.lastUpdate) : null
          if (lastUpdate) {
            // Reset daily counter if it's a new day
            if (
              lastUpdate.getDate() !== now.getDate() ||
              lastUpdate.getMonth() !== now.getMonth() ||
              lastUpdate.getFullYear() !== now.getFullYear()
            ) {
              stats.joins.today = 0
              stats.leaves.today = 0
            }

            // Reset weekly counter if it's a new week
            const lastWeekDay = lastUpdate.getDay()
            const currentWeekDay = now.getDay()
            if (currentWeekDay < lastWeekDay || lastUpdate.getDate() - lastWeekDay !== now.getDate() - currentWeekDay) {
              stats.joins.week = 0
              stats.leaves.week = 0
            }

            // Reset monthly counter if it's a new month
            if (lastUpdate.getMonth() !== now.getMonth() || lastUpdate.getFullYear() !== now.getFullYear()) {
              stats.joins.month = 0
              stats.leaves.month = 0
            }
          }

          // Update join stats
          stats.joins.today += 1
          stats.joins.week += 1
          stats.joins.month += 1
          stats.joins.total += 1

          // Add to join history
          stats.joinHistory.push({
            userId: member.id,
            username: member.user.tag,
            timestamp: now.toISOString(),
            day: today,
          })

          // Limit history size to prevent excessive growth
          if (stats.joinHistory.length > 1000) {
            stats.joinHistory = stats.joinHistory.slice(-1000)
          }

          // Update database
          await statsCollection.updateOne(
            { guildId: guild.id },
            {
              $set: {
                stats: stats,
                lastUpdate: now.toISOString(),
              },
            },
            { upsert: true },
          )

          console.log(`Updated join statistics for ${guild.name}`)
        } catch (statsError) {
          console.error(`Error updating join statistics for ${guild.name}:`, statsError)
        }
      }
    } catch (error) {
      console.error(`Error in guildMemberAdd event for ${guild.name}:`, error)
    } finally {
      if (client) await client.close()
    }
  },
}

