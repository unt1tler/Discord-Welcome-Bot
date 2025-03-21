import { getSession } from "next-auth/react"
import { getToken } from "next-auth/jwt"
import { MongoClient } from "mongodb"

export default async function handler(req, res) {
  try {
    // Get session from both methods to ensure we have it
    const session = await getSession({ req })
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === "production",
    })

    // Debug session information
    console.log("Session available:", Boolean(session))
    console.log("Token available:", Boolean(token))

    if (!session && !token) {
      return res.status(401).json({ error: "Not authenticated" })
    }

    const { id } = req.query

    // Check if user has access to this server
    let userGuilds = []
    try {
      const userGuildsResponse = await fetch("https://discord.com/api/users/@me/guilds", {
        headers: {
          Authorization: `Bearer ${token?.accessToken || session?.accessToken}`,
        },
      })

      if (!userGuildsResponse.ok) {
        console.error("Failed to fetch user guilds:", userGuildsResponse.status)
        return res.status(userGuildsResponse.status).json({
          error: "Failed to fetch user guilds",
          status: userGuildsResponse.status,
        })
      }

      userGuilds = await userGuildsResponse.json()
    } catch (error) {
      console.error("Error fetching user guilds:", error)
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

    // Connect to database
    let client
    let db
    let collection

    if (process.env.MONGODB_URI) {
      try {
        client = new MongoClient(process.env.MONGODB_URI)
        await client.connect()

        db = client.db(process.env.MONGODB_DB_NAME || "discordbot")
        collection = db.collection("guildConfigs")
      } catch (dbError) {
        console.error("Database connection error:", dbError)
        return res.status(500).json({ error: "Database connection error" })
      }
    } else {
      return res.status(500).json({ error: "Database not configured" })
    }

    // Handle GET request - fetch leave config
    if (req.method === "GET") {
      try {
        // Get guild config from database
        const guildConfig = await collection.findOne({ guildId: id })

        // If no config found, return default config
        if (!guildConfig || !guildConfig.leave) {
          const defaultConfig = {
            enabled: false,
            channels: [],
            mode: "embed",
            embed: {
              color: "#ED4245",
              title: "User Left the Server",
              description: "{user} has left our community.",
              footer: "They were with us for {duration}",
              image: "",
            },
            text: "👋 {user} has left the server. They were with us for {duration}.",
            textImage: "",
          }

          return res.status(200).json(defaultConfig)
        }

        // Return the leave config
        return res.status(200).json(guildConfig.leave)
      } catch (error) {
        console.error("Error fetching leave config:", error)
        return res.status(500).json({ error: "Failed to fetch leave configuration" })
      } finally {
        if (client) await client.close()
      }
    }

    // Handle POST request - update leave config
    if (req.method === "POST") {
      try {
        const leaveConfig = req.body

        // Validate the config
        if (!leaveConfig) {
          return res.status(400).json({ error: "No configuration provided" })
        }

        console.log("Updating leave config for guild:", id)
        console.log("New config:", JSON.stringify(leaveConfig))

        // Update the database
        const result = await collection.updateOne(
          { guildId: id },
          {
            $set: { leave: leaveConfig },
            $setOnInsert: { guildId: id },
          },
          { upsert: true },
        )

        console.log("Database update result:", result)

        return res.status(200).json({
          success: true,
          message: "Leave configuration updated successfully",
          config: leaveConfig,
        })
      } catch (error) {
        console.error("Error updating leave config:", error)
        return res.status(500).json({ error: "Failed to update leave configuration" })
      } finally {
        if (client) await client.close()
      }
    }

    // Handle other methods
    res.setHeader("Allow", ["GET", "POST"])
    return res.status(405).json({ error: `Method ${req.method} not allowed` })
  } catch (error) {
    console.error("Error in /api/servers/[id]/leave:", error)
    return res.status(500).json({ error: "Internal server error", message: error.message })
  }
}

