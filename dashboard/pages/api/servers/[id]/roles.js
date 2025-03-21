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
    const updatedConfig = req.body

    // Validate the request body
    if (!updatedConfig) {
      return res.status(400).json({ error: "Invalid request body" })
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
                roles: updatedConfig,
              },
            },
          )
        } else {
          // Create new config
          updateResult = await collection.insertOne({
            guildId: id,
            roles: updatedConfig,
          })
        }

        // Notify the bot about the configuration change
        if (process.env.BOT_API_URL) {
          try {
            await fetch(`${process.env.BOT_API_URL}/update-config`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.BOT_API_TOKEN}`,
              },
              body: JSON.stringify({
                guildId: id,
                configType: "roles",
                config: updatedConfig,
              }),
            })
          } catch (botApiError) {
            console.error("Failed to notify bot about config change:", botApiError)
            // Continue anyway, this is not critical
          }
        }

        res.status(200).json({ success: true, message: "Role settings updated successfully" })
      } catch (dbError) {
        console.error("Database error:", dbError)
        res.status(500).json({ error: "Database error", details: dbError.message })
      } finally {
        if (client) await client.close()
      }
    } else {
      // No database configured, return success but warn
      console.warn("No MongoDB URI configured, role settings not saved")
      res.status(200).json({
        success: true,
        message: "Role settings updated (note: no database configured)",
        warning: "No database configured, changes will not persist after bot restart",
      })
    }
  } catch (error) {
    console.error("Error in /api/servers/[id]/roles:", error)
    res.status(500).json({ error: "Internal server error", message: error.message })
  }
}

