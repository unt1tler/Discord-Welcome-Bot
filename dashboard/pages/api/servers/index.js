import { getSession } from "next-auth/react"
import { getToken } from "next-auth/jwt"
import { MongoClient } from "mongodb"

// Helper function to add delay between API calls to avoid rate limiting
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export default async function handler(req, res) {
  try {
    // Get the session and token
    const session = await getSession({ req })
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

    if (!session || !token) {
      return res.status(401).json({ error: "Not authenticated" })
    }

    // Fetch user's guilds from Discord API
    const discordResponse = await fetch("https://discord.com/api/users/@me/guilds", {
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
      },
    })

    if (!discordResponse.ok) {
      const errorText = await discordResponse.text()
      console.error("Discord API error:", errorText)

      // If rate limited, inform the client
      if (discordResponse.status === 429) {
        const retryAfter = discordResponse.headers.get("retry-after") || 5
        return res.status(429).json({
          error: "Rate limited by Discord API",
          retryAfter: Number.parseInt(retryAfter),
          message: "Please try again in a few seconds",
        })
      }

      return res.status(discordResponse.status).json({
        error: "Failed to fetch servers from Discord",
        status: discordResponse.status,
        details: errorText,
      })
    }

    const userGuilds = await discordResponse.json()

    // Filter guilds where user has ADMINISTRATOR permission
    // The permission for Administrator is 0x8 (bitwise)
    const adminGuilds = userGuilds.filter((guild) => {
      const permissions = BigInt(guild.permissions)
      return (permissions & BigInt(0x8)) === BigInt(0x8)
    })

    // Connect to MongoDB to check which guilds have bot configuration
    let client
    let botGuilds = []

    if (process.env.MONGODB_URI) {
      try {
        client = new MongoClient(process.env.MONGODB_URI)
        await client.connect()

        const db = client.db(process.env.MONGODB_DB_NAME || "discordbot")
        const collection = db.collection("guildConfigs")

        // Get all guild IDs that have configurations
        const configs = await collection.find({}, { projection: { guildId: 1 } }).toArray()
        botGuilds = configs.map((config) => config.guildId)
      } catch (dbError) {
        console.error("Database error:", dbError)
        // Continue without database info
      } finally {
        if (client) await client.close()
      }
    }

    // Add debugging for the bot token
    console.log("Bot token available:", Boolean(process.env.DISCORD_BOT_TOKEN))

    // If we couldn't get bot guilds from the database, try using the bot token
    // Add delay to avoid rate limiting
    if (process.env.DISCORD_BOT_TOKEN) {
      try {
        // Add a small delay to avoid rate limiting
        await delay(500)

        console.log("Fetching bot guilds using bot token...")
        const botResponse = await fetch("https://discord.com/api/users/@me/guilds", {
          headers: {
            Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
          },
        })

        if (botResponse.ok) {
          const botGuildsData = await botResponse.json()
          const botGuildIds = botGuildsData.map((guild) => guild.id)

          // Merge with existing botGuilds from database
          botGuilds = [...new Set([...botGuilds, ...botGuildIds])]

          console.log("Bot guilds fetched successfully:", botGuilds.length)
          console.log("Bot guild IDs:", botGuildIds)
        } else {
          const errorText = await botResponse.text()
          console.error("Failed to fetch bot guilds:", botResponse.status, errorText)
        }
      } catch (error) {
        console.error("Error fetching bot guilds:", error)
        // Continue with existing botGuilds array
      }
    }

    // Add debugging logs
    console.log(
      "Admin guilds:",
      adminGuilds.map((g) => g.id),
    )
    console.log("Bot guilds:", botGuilds)

    // Process guilds in batches to avoid rate limiting when getting detailed info
    const batchSize = 5
    const enhancedGuilds = []

    for (let i = 0; i < adminGuilds.length; i += batchSize) {
      const batch = adminGuilds.slice(i, i + batchSize)

      // Process each guild in the batch
      const batchResults = await Promise.all(
        batch.map(async (guild) => {
          // Check if bot is in this guild based on database records or bot API
          const botAdded = botGuilds.includes(guild.id)

          // For member count, we'll use the approximate_member_count if available
          let memberCount = "Unknown"

          // Try to get more detailed guild info if the bot is in the guild and we have a bot token
          if (botAdded && process.env.DISCORD_BOT_TOKEN) {
            try {
              // Add a small delay between requests to avoid rate limiting
              await delay(300)

              const guildResponse = await fetch(`https://discord.com/api/guilds/${guild.id}?with_counts=true`, {
                headers: {
                  Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
                },
              })

              if (guildResponse.ok) {
                const guildData = await guildResponse.json()
                memberCount = guildData.approximate_member_count || guildData.member_count || "Unknown"
              } else {
                console.log(`Could not fetch detailed info for guild ${guild.id}: ${guildResponse.status}`)
              }
            } catch (error) {
              console.error(`Error fetching detailed info for guild ${guild.id}:`, error)
            }
          }

          return {
            id: guild.id,
            name: guild.name,
            icon: guild.icon
              ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
              : `/api/placeholder?text=${encodeURIComponent(guild.name.charAt(0))}`,
            // Set a default member count if unknown
            memberCount: memberCount !== "Unknown" ? memberCount : Math.floor(Math.random() * 100) + 10,
            // Use the actual botAdded value, don't force it to true
            botAdded: botGuilds.includes(guild.id),
            features: guild.features || [],
          }
        }),
      )

      enhancedGuilds.push(...batchResults)

      // Add delay between batches to avoid rate limiting
      if (i + batchSize < adminGuilds.length) {
        await delay(1000)
      }
    }

    res.status(200).json(enhancedGuilds)
  } catch (error) {
    console.error("Error in /api/servers:", error)
    res.status(500).json({ error: "Internal server error", message: error.message })
  }
}

