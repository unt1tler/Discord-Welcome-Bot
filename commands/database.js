const { SlashCommandBuilder } = require("@discordjs/builders")
const {
  seedGuildData,
  resetDailyStats,
  resetWeeklyStats,
  resetMonthlyStats,
  connectToDatabase,
} = require("../utils/database")

module.exports = {
  data: new SlashCommandBuilder()
    .setName("database")
    .setDescription("Database management commands")
    .addSubcommand((subcommand) => subcommand.setName("seed").setDescription("Seed initial data for testing"))
    .addSubcommand((subcommand) =>
      subcommand
        .setName("reset")
        .setDescription("Reset statistics counters")
        .addStringOption((option) =>
          option
            .setName("type")
            .setDescription("Type of reset to perform")
            .setRequired(true)
            .addChoices(
              { name: "Daily", value: "daily" },
              { name: "Weekly", value: "weekly" },
              { name: "Monthly", value: "monthly" },
              { name: "All", value: "all" },
            ),
        ),
    )
    .addSubcommand((subcommand) => subcommand.setName("status").setDescription("Check database connection status")),
  async execute(interaction) {
    // Check if user has admin permissions
    if (!interaction.member.permissions.has("ADMINISTRATOR")) {
      return interaction.reply({
        content: "You need administrator permissions to use database commands.",
        ephemeral: true,
      })
    }

    // Check if database is enabled
    if (process.env.USE_DATABASE !== "true") {
      return interaction.reply({
        content: "Database functionality is disabled. Set USE_DATABASE=true in your .env file to enable it.",
        ephemeral: true,
      })
    }

    const subcommand = interaction.options.getSubcommand()

    if (subcommand === "seed") {
      await interaction.deferReply({ ephemeral: true })

      try {
        const guildId = interaction.guild.id
        const result = await seedGuildData(guildId)

        if (result) {
          await interaction.editReply({
            content: "✅ Successfully seeded initial data for this server. Refresh the dashboard to see the data.",
            ephemeral: true,
          })
        } else {
          await interaction.editReply({
            content: "❌ Failed to seed data. Check the console for more information.",
            ephemeral: true,
          })
        }
      } catch (error) {
        console.error("Error seeding data:", error)
        await interaction.editReply({
          content: `❌ An error occurred: ${error.message}`,
          ephemeral: true,
        })
      }
    } else if (subcommand === "reset") {
      await interaction.deferReply({ ephemeral: true })

      try {
        const resetType = interaction.options.getString("type")
        let result = false

        switch (resetType) {
          case "daily":
            result = await resetDailyStats()
            break
          case "weekly":
            result = await resetWeeklyStats()
            break
          case "monthly":
            result = await resetMonthlyStats()
            break
          case "all":
            const daily = await resetDailyStats()
            const weekly = await resetWeeklyStats()
            const monthly = await resetMonthlyStats()
            result = daily && weekly && monthly
            break
        }

        if (result) {
          await interaction.editReply({
            content: `✅ Successfully reset ${resetType} statistics.`,
            ephemeral: true,
          })
        } else {
          await interaction.editReply({
            content: `❌ Failed to reset ${resetType} statistics. Check the console for more information.`,
            ephemeral: true,
          })
        }
      } catch (error) {
        console.error("Error resetting stats:", error)
        await interaction.editReply({
          content: `❌ An error occurred: ${error.message}`,
          ephemeral: true,
        })
      }
    } else if (subcommand === "status") {
      await interaction.deferReply({ ephemeral: true })

      try {
        const { client, db } = await connectToDatabase()

        if (db) {
          const stats = {
            connection: "Connected",
            host: client.options.hosts.map((h) => `${h.host}:${h.port}`).join(", "),
            database: db.databaseName,
            collections: await db.listCollections().toArray(),
          }

          await interaction.editReply({
            content: "✅ Database connection is active.\n```json\n" + JSON.stringify(stats, null, 2) + "\n```",
            ephemeral: true,
          })
        } else {
          await interaction.editReply({
            content: "❌ Database connection failed.",
            ephemeral: true,
          })
        }
      } catch (error) {
        console.error("Error checking database status:", error)
        await interaction.editReply({
          content: `❌ An error occurred: ${error.message}`,
          ephemeral: true,
        })
      }
    }
  },
}

