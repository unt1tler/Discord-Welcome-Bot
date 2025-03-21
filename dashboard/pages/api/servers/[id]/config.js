import { getSession } from "next-auth/react"
import { getToken } from "next-auth/jwt"
import { MongoClient } from "mongodb"

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    // Get session from both methods to ensure we have it
    const session = await getSession({ req })
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === "production",
    })

    if (!session && !token) {
      return res.status(401).json({ error: "Not authenticated" })
    }

    const { id } = req.query
    const { prefix } = req.body

    // Validate the prefix
    if (!prefix || typeof prefix !== "string" || prefix.length > 3) {
      return res.status(400).json({ error: "Invalid prefix. Must be 1-3 characters." })
    }

    // Check if user has access to this server
    let userGuilds = []
    try {
      const userGuildsResponse = await fetch("https://discord.com/api/users/@me/guilds", {
        headers: {
          Authorization: `Bearer ${token?.accessToken || session?.accessToken}`,
        },
      })

      if (!userGuildsResponse.ok) {
        return res.status(userGuildsResponse.status).json({
          error: "Failed to fetch user guilds",
          status: userGuildsResponse.status,
        })
      }

      userGuilds = await userGuildsResponse.json()
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch user guilds", details: error.message })
    }

    const userGuild = userGuilds.find((guild) => guild.id === id)

    if (!userGuild) {
      return res.status(404).json({ error: "Server not found or you don't have access" })
    }

    // Check if user has admin permission
    const permissions = BigInt(userGuild.permissions)
    const hasAdmin = (permissions & BigInt(0x8)) === BigInt(0x8)

    if (!hasAdmin) {
      return res.status(403).json({ error: "You don't have administrator permission for this server" })
    }

    // Update guild configuration in database
    let client
    let updateResult

    if (process.env.MONGODB_URI) {
      try {
        client = new MongoClient(process.env.MONGODB_URI)
        await client.connect()

        const db = client.db(process.env.MONGODB_DB_NAME || "discordbot")
        const collection = db.collection("guildConfigs")

        // Check if config exists
        const existingConfig = await collection.findOne({ guildId: id })

        if (existingConfig) {
          // Update existing config
          updateResult = await collection.updateOne(
            { guildId: id },
            {
              $set: {
                prefix: prefix,
              },
            },
          )
        } else {
          // Create new config
          updateResult = await collection.insertOne({
            guildId: id,
            prefix: prefix,
          })
        }

        // Notify the bot about the configuration change if BOT_API_URL is configured
        if (process.env.BOT_API_URL && process.env.BOT_API_TOKEN) {
          try {
            await fetch(`${process.env.BOT_API_URL}/update-config`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.BOT_API_TOKEN}`,
              },
              body: JSON.stringify({
                guildId: id,
                configType: "prefix",
                prefix: prefix,
              }),
            })
          } catch (botApiError) {
            console.error("Failed to notify bot about config change:", botApiError)
            // Continue anyway, this is not critical
          }
        }

        // If we have a bot token, try to update the prefix directly via Discord API
        if (process.env.DISCORD_BOT_TOKEN) {
          try {
            // This is a simplified approach - in a real implementation, you'd need
            // to communicate with your bot process to update its in-memory config
            console.log(`Bot token available, would update prefix for guild ${id} to ${prefix}`)
            // The actual implementation would depend on how your bot handles config updates
          } catch (error) {
            console.error("Error updating prefix via Discord API:", error)
          }
        }

        res.status(200).json({ success: true, message: "Prefix updated successfully", prefix })
      } catch (dbError) {
        console.error("Database error:", dbError)
        res.status(500).json({ error: "Database error", details: dbError.message })
      } finally {
        if (client) await client.close()
      }
    } else {
      // No database configured, return success but warn
      console.warn("No MongoDB URI configured, prefix not saved")
      res.status(200).json({
        success: true,
        message: "Prefix updated (note: no database configured)",
        warning: "No database configured, changes will not persist after bot restart",
        prefix,
      })
    }
  } catch (error) {
    console.error("Error in /api/servers/[id]/config:", error)
    res.status(500).json({ error: "Internal server error", message: error.message })
  }
}

