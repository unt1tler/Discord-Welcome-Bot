const { connectToDatabase, resetDailyStats, resetWeeklyStats, resetMonthlyStats } = require("../utils/database")

module.exports = {
  name: "ready",
  once: true,
  async execute(client) {
    console.log(`Ready! Logged in as ${client.user.tag}`)

    // Connect to database if enabled
    if (process.env.USE_DATABASE === "true") {
      try {
        await connectToDatabase()
        console.log("Connected to MongoDB database")

        // Set up scheduled tasks for stats reset
        setupStatsResetSchedule()
      } catch (error) {
        console.error("Failed to connect to database:", error)
      }
    }

    // Set bot status
    client.user.setActivity("/help | Welcoming members", { type: "PLAYING" })
  },
}

// Set up scheduled tasks to reset stats
function setupStatsResetSchedule() {
  // Reset daily stats at midnight
  const resetDaily = () => {
    const now = new Date()
    const night = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1, // tomorrow
      0,
      0,
      0, // midnight
    )
    const msToMidnight = night.getTime() - now.getTime()

    setTimeout(async () => {
      console.log("Resetting daily stats...")
      await resetDailyStats()
      console.log("Daily stats reset complete")

      // Schedule next reset
      resetDaily()
    }, msToMidnight)

    console.log(`Scheduled daily stats reset in ${Math.floor(msToMidnight / 1000 / 60)} minutes`)
  }

  // Reset weekly stats on Sunday at midnight
  const resetWeekly = () => {
    const now = new Date()
    const daysToSunday = 7 - now.getDay()
    const sunday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysToSunday, 0, 0, 0)
    const msToSunday = sunday.getTime() - now.getTime()

    setTimeout(async () => {
      console.log("Resetting weekly stats...")
      await resetWeeklyStats()
      console.log("Weekly stats reset complete")

      // Schedule next reset
      resetWeekly()
    }, msToSunday)

    console.log(`Scheduled weekly stats reset in ${Math.floor(msToSunday / 1000 / 60 / 60)} hours`)
  }

  // Reset monthly stats on the 1st of each month
  const resetMonthly = () => {
    const now = new Date()
    const firstOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0)
    const msToFirstOfMonth = firstOfNextMonth.getTime() - now.getTime()

    setTimeout(async () => {
      console.log("Resetting monthly stats...")
      await resetMonthlyStats()
      console.log("Monthly stats reset complete")

      // Schedule next reset
      resetMonthly()
    }, msToFirstOfMonth)

    console.log(`Scheduled monthly stats reset in ${Math.floor(msToFirstOfMonth / 1000 / 60 / 60 / 24)} days`)
  }

  // Start all scheduled tasks
  resetDaily()
  resetWeekly()
  resetMonthly()
}

