const { SlashCommandBuilder } = require("@discordjs/builders")
const { PermissionFlagsBits } = require("discord.js")
const { MongoClient } = require("mongodb")

module.exports = {
  data: new SlashCommandBuilder()
    .setName("role")
    .setDescription("Manage roles for the server")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("auto-add")
        .setDescription("Add a role to be automatically assigned to new members")
        .addRoleOption((option) =>
          option.setName("role").setDescription("The role to automatically assign").setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("auto-remove")
        .setDescription("Remove a role from being automatically assigned")
        .addRoleOption((option) =>
          option.setName("role").setDescription("The role to remove from auto-assignment").setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("self-add")
        .setDescription("Add a role to the self-assignable roles list")
        .addRoleOption((option) =>
          option.setName("role").setDescription("The role to make self-assignable").setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("self-remove")
        .setDescription("Remove a role from the self-assignable roles list")
        .addRoleOption((option) =>
          option.setName("role").setDescription("The role to remove from self-assignable").setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Add a self-assignable role to yourself")
        .addRoleOption((option) =>
          option.setName("role").setDescription("The role to add to yourself").setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove")
        .setDescription("Remove a self-assignable role from yourself")
        .addRoleOption((option) =>
          option.setName("role").setDescription("The role to remove from yourself").setRequired(true),
        ),
    )
    .addSubcommand((subcommand) => subcommand.setName("list").setDescription("List all self-assignable roles"))
    .addSubcommand((subcommand) =>
      subcommand
        .setName("enable")
        .setDescription("Enable or disable auto-role functionality")
        .addBooleanOption((option) =>
          option.setName("enabled").setDescription("Whether auto-role should be enabled").setRequired(true),
        ),
    ),

  async execute(interaction) {
    const { options, guild, member } = interaction
    const subcommand = options.getSubcommand()

    // Get the MongoDB client
    let client
    let guildConfig

    try {
      if (process.env.MONGODB_URI) {
        client = new MongoClient(process.env.MONGODB_URI)
        await client.connect()

        const db = client.db(process.env.MONGODB_DB_NAME || "discordbot")
        const collection = db.collection("guildConfigs")

        // Get the guild configuration
        guildConfig = await collection.findOne({ guildId: guild.id })

        if (!guildConfig) {
          // Create default config if it doesn't exist
          guildConfig = {
            guildId: guild.id,
            roles: {
              enabled: false,
              autoAssign: [],
              selfAssignable: [],
            },
          }

          await collection.insertOne(guildConfig)
        }

        // Ensure roles object exists
        if (!guildConfig.roles) {
          guildConfig.roles = {
            enabled: false,
            autoAssign: [],
            selfAssignable: [],
          }
        }
      } else {
        // If no MongoDB URI is provided, use a default config
        guildConfig = {
          guildId: guild.id,
          roles: {
            enabled: false,
            autoAssign: [],
            selfAssignable: [],
          },
        }
      }

      // Handle subcommands
      switch (subcommand) {
        case "auto-add": {
          // Check if user has admin permissions
          if (!member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
              content: "❌ You need Administrator permission to use this command.",
              ephemeral: true,
            })
          }

          const role = options.getRole("role")

          // Check if role is already in auto-assign list
          if (guildConfig.roles.autoAssign.includes(role.id)) {
            return interaction.reply({
              content: `❌ The role ${role.name} is already in the auto-assign list.`,
              ephemeral: true,
            })
          }

          // Add role to auto-assign list
          guildConfig.roles.autoAssign.push(role.id)

          // Update database
          if (client) {
            const db = client.db(process.env.MONGODB_DB_NAME || "discordbot")
            const collection = db.collection("guildConfigs")

            await collection.updateOne({ guildId: guild.id }, { $set: { roles: guildConfig.roles } })
          }

          return interaction.reply({
            content: `✅ The role ${role.name} will now be automatically assigned to new members.`,
            ephemeral: true,
          })
        }

        case "auto-remove": {
          // Check if user has admin permissions
          if (!member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
              content: "❌ You need Administrator permission to use this command.",
              ephemeral: true,
            })
          }

          const role = options.getRole("role")

          // Check if role is in auto-assign list
          if (!guildConfig.roles.autoAssign.includes(role.id)) {
            return interaction.reply({
              content: `❌ The role ${role.name} is not in the auto-assign list.`,
              ephemeral: true,
            })
          }

          // Remove role from auto-assign list
          guildConfig.roles.autoAssign = guildConfig.roles.autoAssign.filter((id) => id !== role.id)

          // Update database
          if (client) {
            const db = client.db(process.env.MONGODB_DB_NAME || "discordbot")
            const collection = db.collection("guildConfigs")

            await collection.updateOne({ guildId: guild.id }, { $set: { roles: guildConfig.roles } })
          }

          return interaction.reply({
            content: `✅ The role ${role.name} will no longer be automatically assigned to new members.`,
            ephemeral: true,
          })
        }

        case "self-add": {
          // Check if user has admin permissions
          if (!member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
              content: "❌ You need Administrator permission to use this command.",
              ephemeral: true,
            })
          }

          const role = options.getRole("role")

          // Check if role is already in self-assignable list
          if (guildConfig.roles.selfAssignable.includes(role.id)) {
            return interaction.reply({
              content: `❌ The role ${role.name} is already in the self-assignable list.`,
              ephemeral: true,
            })
          }

          // Add role to self-assignable list
          guildConfig.roles.selfAssignable.push(role.id)

          // Update database
          if (client) {
            const db = client.db(process.env.MONGODB_DB_NAME || "discordbot")
            const collection = db.collection("guildConfigs")

            await collection.updateOne({ guildId: guild.id }, { $set: { roles: guildConfig.roles } })
          }

          return interaction.reply({ content: `✅ The role ${role.name} is now self-assignable.`, ephemeral: true })
        }

        case "self-remove": {
          // Check if user has admin permissions
          if (!member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
              content: "❌ You need Administrator permission to use this command.",
              ephemeral: true,
            })
          }

          const role = options.getRole("role")

          // Check if role is in self-assignable list
          if (!guildConfig.roles.selfAssignable.includes(role.id)) {
            return interaction.reply({
              content: `❌ The role ${role.name} is not in the self-assignable list.`,
              ephemeral: true,
            })
          }

          // Remove role from self-assignable list
          guildConfig.roles.selfAssignable = guildConfig.roles.selfAssignable.filter((id) => id !== role.id)

          // Update database
          if (client) {
            const db = client.db(process.env.MONGODB_DB_NAME || "discordbot")
            const collection = db.collection("guildConfigs")

            await collection.updateOne({ guildId: guild.id }, { $set: { roles: guildConfig.roles } })
          }

          return interaction.reply({
            content: `✅ The role ${role.name} is no longer self-assignable.`,
            ephemeral: true,
          })
        }

        case "add": {
          const role = options.getRole("role")

          // Check if role is in self-assignable list
          if (!guildConfig.roles.selfAssignable.includes(role.id)) {
            return interaction.reply({ content: `❌ The role ${role.name} is not self-assignable.`, ephemeral: true })
          }

          // Check if user already has the role
          if (member.roles.cache.has(role.id)) {
            return interaction.reply({ content: `❌ You already have the ${role.name} role.`, ephemeral: true })
          }

          // Add role to user
          try {
            await member.roles.add(role)
            return interaction.reply({ content: `✅ You now have the ${role.name} role.`, ephemeral: true })
          } catch (error) {
            console.error(`Error adding role to user: ${error}`)
            return interaction.reply({
              content: `❌ Failed to add the role. Make sure the bot has the necessary permissions.`,
              ephemeral: true,
            })
          }
        }

        case "remove": {
          const role = options.getRole("role")

          // Check if role is in self-assignable list
          if (!guildConfig.roles.selfAssignable.includes(role.id)) {
            return interaction.reply({ content: `❌ The role ${role.name} is not self-assignable.`, ephemeral: true })
          }

          // Check if user has the role
          if (!member.roles.cache.has(role.id)) {
            return interaction.reply({ content: `❌ You don't have the ${role.name} role.`, ephemeral: true })
          }

          // Remove role from user
          try {
            await member.roles.remove(role)
            return interaction.reply({ content: `✅ The ${role.name} role has been removed.`, ephemeral: true })
          } catch (error) {
            console.error(`Error removing role from user: ${error}`)
            return interaction.reply({
              content: `❌ Failed to remove the role. Make sure the bot has the necessary permissions.`,
              ephemeral: true,
            })
          }
        }

        case "list": {
          // Get all self-assignable roles
          const selfAssignableRoles = guildConfig.roles.selfAssignable
            .map((roleId) => guild.roles.cache.get(roleId))
            .filter((role) => role !== undefined)

          if (selfAssignableRoles.length === 0) {
            return interaction.reply({
              content: "❌ There are no self-assignable roles in this server.",
              ephemeral: true,
            })
          }

          const rolesList = selfAssignableRoles.map((role) => `- ${role.name}`).join("\n")

          return interaction.reply({
            content: `**Self-Assignable Roles:**\n${rolesList}\n\nUse \`/role add\` to add a role or \`/role remove\` to remove a role.`,
            ephemeral: true,
          })
        }

        case "enable": {
          // Check if user has admin permissions
          if (!member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
              content: "❌ You need Administrator permission to use this command.",
              ephemeral: true,
            })
          }

          const enabled = options.getBoolean("enabled")

          // Update config
          guildConfig.roles.enabled = enabled

          // Update database
          if (client) {
            const db = client.db(process.env.MONGODB_DB_NAME || "discordbot")
            const collection = db.collection("guildConfigs")

            await collection.updateOne({ guildId: guild.id }, { $set: { roles: guildConfig.roles } })
          }

          return interaction.reply({
            content: `✅ Auto-role has been ${enabled ? "enabled" : "disabled"}.`,
            ephemeral: true,
          })
        }

        default:
          return interaction.reply({ content: "❌ Invalid subcommand.", ephemeral: true })
      }
    } catch (error) {
      console.error(`Error executing role command: ${error}`)
      return interaction.reply({ content: "❌ An error occurred while executing this command.", ephemeral: true })
    } finally {
      if (client) await client.close()
    }
  },
}

