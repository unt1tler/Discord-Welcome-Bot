const { Events } = require("discord.js")
const { MongoClient } = require("mongodb")
const { createLeaveEmbed, formatLeaveText } = require("../utils/messageUtils")
const { createLeaveCard } = require("../utils/canvasUtils")
const { recordMemberLeave } = require("../utils/database")
const { sendLeaveMessage } = require("../utils/messageUtils")

module.exports = {
  name: "guildMemberRemove",
  once: false,
  async execute(member) {
    const { guild } = member

    // Declare duration variable
    let duration = "unknown time"
    // Declare client variable
    let client

    try {
      console.log(`Member left: ${member.user.tag} from ${member.guild.name}`)

      // Record the leave in the database
      if (process.env.USE_DATABASE === "true") {
        await recordMemberLeave(member.guild.id, member.user.id)
        console.log(`Recorded leave for ${member.user.tag} in database`)
      }

      // Send leave message
      await sendLeaveMessage(member)

      // Connect to MongoDB

      let guildConfig

      if (process.env.MONGODB_URI) {
        client = new MongoClient(process.env.MONGODB_URI)
        await client.connect()

        const db = client.db(process.env.MONGODB_DB_NAME || "discordbot")
        const collection = db.collection("guildConfigs")

        // Get guild configuration
        guildConfig = await collection.findOne({ guildId: guild.id })
      }

      // Handle leave message
      if (
        guildConfig?.leave?.enabled &&
        Array.isArray(guildConfig.leave.channels) &&
        guildConfig.leave.channels.length > 0
      ) {
        // Calculate duration the member was in the server
        let joinDate

        if (member.joinedAt) {
          joinDate = member.joinedAt
          const now = new Date()
          const diffTime = Math.abs(now - joinDate)
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

          if (diffDays === 0) {
            const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
            if (diffHours === 0) {
              const diffMinutes = Math.floor(diffTime / (1000 * 60))
              duration = `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""}`
            } else {
              duration = `${diffHours} hour${diffHours !== 1 ? "s" : ""}`
            }
          } else if (diffDays < 30) {
            duration = `${diffDays} day${diffDays !== 1 ? "s" : ""}`
          } else if (diffDays < 365) {
            const diffMonths = Math.floor(diffDays / 30)
            duration = `${diffMonths} month${diffMonths !== 1 ? "s" : ""}`
          } else {
            const diffYears = Math.floor(diffDays / 365)
            duration = `${diffYears} year${diffYears !== 1 ? "s" : ""}`
          }
        }

        // Send leave message to all configured channels
        for (const channelId of guildConfig.leave.channels) {
          const channel = await guild.channels.fetch(channelId).catch(() => null)

          if (channel && channel.isTextBased()) {
            try {
              if (guildConfig.leave.mode === "embed") {
                // Create and send embed
                const embed = createLeaveEmbed(member, duration, guildConfig.leave.embed)

                // Check if we need to attach an image
                if (guildConfig.leave.embed.image) {
                  await channel.send({ embeds: [embed] })
                } else {
                  // Create leave card
                  const leaveCard = await createLeaveCard(member, duration, guild.name)

                  await channel.send({
                    embeds: [embed],
                    files: [{ attachment: leaveCard, name: "leave.png" }],
                  })
                }
              } else {
                // Format and send text message
                const leaveText = formatLeaveText(member, duration, guildConfig.leave.text)

                // Check if we need to attach an image
                if (guildConfig.leave.image) {
                  await channel.send({
                    content: leaveText,
                    files: [{ attachment: guildConfig.leave.image, name: "leave-image.png" }],
                  })
                } else {
                  // Create leave card
                  const leaveCard = await createLeaveCard(member, duration, guild.name)

                  await channel.send({
                    content: leaveText,
                    files: [{ attachment: leaveCard, name: "leave.png" }],
                  })
                }
              }

              console.log(`Sent leave message for ${member.user.tag} in ${guild.name}`)
            } catch (messageError) {
              console.error(`Error sending leave message in ${guild.name}:`, messageError)
            }
          }
        }
      }

      // Update leave statistics
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

          // Update leave stats
          stats.leaves.today += 1
          stats.leaves.week += 1
          stats.leaves.month += 1
          stats.leaves.total += 1

          // Add to leave history
          stats.leaveHistory.push({
            userId: member.id,
            username: member.user.tag,
            timestamp: now.toISOString(),
            day: today,
            joinedAt: member.joinedAt ? member.joinedAt.toISOString() : null,
            duration: duration,
          })

          // Limit history size to prevent excessive growth
          if (stats.leaveHistory.length > 1000) {
            stats.leaveHistory = stats.leaveHistory.slice(-1000)
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

          console.log(`Updated leave statistics for ${guild.name}`)
        } catch (statsError) {
          console.error(`Error updating leave statistics for ${guild.name}:`, statsError)
        }
      }
    } catch (error) {
      console.error(`Error handling guildMemberRemove event for ${member.user.tag}:`, error)
    } finally {
      if (client) await client.close()
    }
  },
}

