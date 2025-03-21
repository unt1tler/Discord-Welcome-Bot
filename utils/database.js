const { MongoClient } = require("mongodb")

// Database connection singleton
let client = null
let db = null

/**
 * Initialize the database connection
 * @returns {Promise<Object>} The database connection
 */
async function connectToDatabase() {
  if (db) return { client, db }

  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI environment variable is not set")
    }

    console.log("Connecting to MongoDB...")
    client = new MongoClient(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })

    await client.connect()
    console.log("Connected to MongoDB")

    db = client.db(process.env.MONGODB_DB_NAME || "discordbot")

    // Create necessary collections and indexes if they don't exist
    await setupCollections(db)

    return { client, db }
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error)
    throw error
  }
}

/**
 * Set up collections and indexes
 * @param {Object} db The database connection
 */
async function setupCollections(db) {
  // Create collections if they don't exist
  const collections = await db.listCollections().toArray()
  const collectionNames = collections.map((c) => c.name)

  if (!collectionNames.includes("guildConfigs")) {
    await db.createCollection("guildConfigs")
    await db.collection("guildConfigs").createIndex({ guildId: 1 }, { unique: true })
  }

  if (!collectionNames.includes("guildStats")) {
    await db.createCollection("guildStats")
    await db.collection("guildStats").createIndex({ guildId: 1 }, { unique: true })
  }

  console.log("Database collections and indexes set up")
}

/**
 * Get guild configuration from the database
 * @param {string} guildId The guild ID
 * @returns {Promise<Object>} The guild configuration
 */
async function getGuildConfig(guildId) {
  try {
    const { db } = await connectToDatabase()
    return await db.collection("guildConfigs").findOne({ guildId })
  } catch (error) {
    console.error(`Error getting guild config for ${guildId}:`, error)
    return null
  }
}

/**
 * Save guild configuration to the database
 * @param {string} guildId The guild ID
 * @param {Object} config The guild configuration
 * @returns {Promise<boolean>} Whether the operation was successful
 */
async function saveGuildConfig(guildId, config) {
  try {
    const { db } = await connectToDatabase()
    await db
      .collection("guildConfigs")
      .updateOne({ guildId }, { $set: { ...config, guildId, updatedAt: new Date() } }, { upsert: true })
    return true
  } catch (error) {
    console.error(`Error saving guild config for ${guildId}:`, error)
    return false
  }
}

/**
 * Get guild statistics from the database
 * @param {string} guildId The guild ID
 * @returns {Promise<Object>} The guild statistics
 */
async function getGuildStats(guildId) {
  try {
    const { db } = await connectToDatabase()
    return await db.collection("guildStats").findOne({ guildId })
  } catch (error) {
    console.error(`Error getting guild stats for ${guildId}:`, error)
    return null
  }
}

/**
 * Initialize guild statistics in the database
 * @param {string} guildId The guild ID
 * @returns {Promise<boolean>} Whether the operation was successful
 */
async function initGuildStats(guildId) {
  try {
    const { db } = await connectToDatabase()
    const now = new Date()

    // Create initial stats structure
    const initialStats = {
      guildId,
      stats: {
        joins: {
          today: 0,
          week: 0,
          month: 0,
          total: 0,
        },
        leaves: {
          today: 0,
          week: 0,
          month: 0,
          total: 0,
        },
        joinHistory: [],
        leaveHistory: [],
        createdAt: now,
        updatedAt: now,
      },
    }

    await db.collection("guildStats").updateOne({ guildId }, { $setOnInsert: initialStats }, { upsert: true })

    return true
  } catch (error) {
    console.error(`Error initializing guild stats for ${guildId}:`, error)
    return false
  }
}

/**
 * Record a member join event
 * @param {string} guildId The guild ID
 * @param {string} userId The user ID
 * @returns {Promise<boolean>} Whether the operation was successful
 */
async function recordMemberJoin(guildId, userId) {
  try {
    const { db } = await connectToDatabase()
    const now = new Date()

    // Initialize stats if they don't exist
    await initGuildStats(guildId)

    // Update join counts
    await db.collection("guildStats").updateOne(
      { guildId },
      {
        $inc: {
          "stats.joins.today": 1,
          "stats.joins.week": 1,
          "stats.joins.month": 1,
          "stats.joins.total": 1,
        },
        $push: {
          "stats.joinHistory": {
            userId,
            timestamp: now,
          },
        },
        $set: {
          "stats.updatedAt": now,
        },
      },
    )

    return true
  } catch (error) {
    console.error(`Error recording member join for ${guildId}/${userId}:`, error)
    return false
  }
}

/**
 * Record a member leave event
 * @param {string} guildId The guild ID
 * @param {string} userId The user ID
 * @returns {Promise<boolean>} Whether the operation was successful
 */
async function recordMemberLeave(guildId, userId) {
  try {
    const { db } = await connectToDatabase()
    const now = new Date()

    // Initialize stats if they don't exist
    await initGuildStats(guildId)

    // Update leave counts
    await db.collection("guildStats").updateOne(
      { guildId },
      {
        $inc: {
          "stats.leaves.today": 1,
          "stats.leaves.week": 1,
          "stats.leaves.month": 1,
          "stats.leaves.total": 1,
        },
        $push: {
          "stats.leaveHistory": {
            userId,
            timestamp: now,
          },
        },
        $set: {
          "stats.updatedAt": now,
        },
      },
    )

    return true
  } catch (error) {
    console.error(`Error recording member leave for ${guildId}/${userId}:`, error)
    return false
  }
}

/**
 * Reset daily statistics (should be called once per day)
 * @returns {Promise<boolean>} Whether the operation was successful
 */
async function resetDailyStats() {
  try {
    const { db } = await connectToDatabase()

    // Reset today's counts for all guilds
    await db.collection("guildStats").updateMany(
      {},
      {
        $set: {
          "stats.joins.today": 0,
          "stats.leaves.today": 0,
          "stats.updatedAt": new Date(),
        },
      },
    )

    return true
  } catch (error) {
    console.error("Error resetting daily stats:", error)
    return false
  }
}

/**
 * Reset weekly statistics (should be called once per week)
 * @returns {Promise<boolean>} Whether the operation was successful
 */
async function resetWeeklyStats() {
  try {
    const { db } = await connectToDatabase()

    // Reset weekly counts for all guilds
    await db.collection("guildStats").updateMany(
      {},
      {
        $set: {
          "stats.joins.week": 0,
          "stats.leaves.week": 0,
          "stats.updatedAt": new Date(),
        },
      },
    )

    return true
  } catch (error) {
    console.error("Error resetting weekly stats:", error)
    return false
  }
}

/**
 * Reset monthly statistics (should be called once per month)
 * @returns {Promise<boolean>} Whether the operation was successful
 */
async function resetMonthlyStats() {
  try {
    const { db } = await connectToDatabase()

    // Reset monthly counts for all guilds
    await db.collection("guildStats").updateMany(
      {},
      {
        $set: {
          "stats.joins.month": 0,
          "stats.leaves.month": 0,
          "stats.updatedAt": new Date(),
        },
      },
    )

    return true
  } catch (error) {
    console.error("Error resetting monthly stats:", error)
    return false
  }
}

/**
 * Seed initial data for a guild (for testing purposes)
 * @param {string} guildId The guild ID
 * @returns {Promise<boolean>} Whether the operation was successful
 */
async function seedGuildData(guildId) {
  try {
    const { db } = await connectToDatabase()
    const now = new Date()

    // Create sample join/leave history for the past year
    const joinHistory = []
    const leaveHistory = []

    // Generate random join/leave events for the past year
    for (let i = 0; i < 365; i++) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)

      // Random number of joins/leaves per day (more joins than leaves)
      const joinsToday = Math.floor(Math.random() * 3) // 0-2 joins per day
      const leavesToday = Math.random() < 0.3 ? 1 : 0 // 30% chance of 1 leave

      // Add join events
      for (let j = 0; j < joinsToday; j++) {
        joinHistory.push({
          userId: `user${Math.floor(Math.random() * 1000)}`,
          timestamp: new Date(date),
        })
      }

      // Add leave events
      for (let j = 0; j < leavesToday; j++) {
        leaveHistory.push({
          userId: `user${Math.floor(Math.random() * 1000)}`,
          timestamp: new Date(date),
        })
      }
    }

    // Calculate totals
    const totalJoins = joinHistory.length
    const totalLeaves = leaveHistory.length

    // Calculate today's joins/leaves
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayJoins = joinHistory.filter((j) => new Date(j.timestamp) >= today).length
    const todayLeaves = leaveHistory.filter((l) => new Date(l.timestamp) >= today).length

    // Calculate this week's joins/leaves
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    weekStart.setHours(0, 0, 0, 0)
    const weekJoins = joinHistory.filter((j) => new Date(j.timestamp) >= weekStart).length
    const weekLeaves = leaveHistory.filter((l) => new Date(l.timestamp) >= weekStart).length

    // Calculate this month's joins/leaves
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)
    const monthJoins = joinHistory.filter((j) => new Date(j.timestamp) >= monthStart).length
    const monthLeaves = leaveHistory.filter((l) => new Date(l.timestamp) >= monthStart).length

    // Create stats object
    const stats = {
      guildId,
      stats: {
        joins: {
          today: todayJoins,
          week: weekJoins,
          month: monthJoins,
          total: totalJoins,
        },
        leaves: {
          today: todayLeaves,
          week: weekLeaves,
          month: monthLeaves,
          total: totalLeaves,
        },
        joinHistory,
        leaveHistory,
        createdAt: now,
        updatedAt: now,
      },
    }

    // Save to database
    await db.collection("guildStats").updateOne({ guildId }, { $set: stats }, { upsert: true })

    console.log(`Seeded data for guild ${guildId}`)
    return true
  } catch (error) {
    console.error(`Error seeding guild data for ${guildId}:`, error)
    return false
  }
}

module.exports = {
  connectToDatabase,
  getGuildConfig,
  saveGuildConfig,
  getGuildStats,
  initGuildStats,
  recordMemberJoin,
  recordMemberLeave,
  resetDailyStats,
  resetWeeklyStats,
  resetMonthlyStats,
  seedGuildData,
}

