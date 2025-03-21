import axios from "axios"

// Helper function to handle API responses
export async function fetchAPI(endpoint, options = {}) {
  try {
    const res = await fetch(endpoint, options)

    if (!res.ok) {
      // Try to parse error message from response
      let errorMessage
      try {
        const errorData = await res.json()
        errorMessage = errorData.error || errorData.message || `API error: ${res.status}`
      } catch (e) {
        errorMessage = `API error: ${res.status}`
      }

      throw new Error(errorMessage)
    }

    return await res.json()
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error)
    throw error
  }
}

// Server-related API calls
export const serverAPI = {
  // Get all servers where user has admin permissions
  getServers: async () => {
    return fetchAPI("/api/servers")
  },

  // Get a specific server's details
  getServer: async (serverId) => {
    return fetchAPI(`/api/servers/${serverId}`)
  },

  // Get welcome message configuration
  getWelcomeConfig: async (serverId) => {
    return fetchAPI(`/api/servers/${serverId}/welcome`)
  },

  // Update welcome message configuration
  updateWelcomeConfig: async (serverId, config) => {
    return fetchAPI(`/api/servers/${serverId}/welcome`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(config),
    })
  },

  // Get leave message configuration
  getLeaveConfig: async (serverId) => {
    return fetchAPI(`/api/servers/${serverId}/leave`)
  },

  // Update leave message configuration
  updateLeaveConfig: async (serverId, config) => {
    return fetchAPI(`/api/servers/${serverId}/leave`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(config),
    })
  },

  // Get server statistics
  getServerStats: async (serverId) => {
    return fetchAPI(`/api/servers/${serverId}/stats`)
  },
}

// Discord API helper
export const discordAPI = {
  // Get user's Discord servers
  getUserGuilds: async (token) => {
    try {
      const response = await axios.get("https://discord.com/api/users/@me/guilds", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      return response.data
    } catch (error) {
      console.error("Error fetching user guilds:", error)
      throw error
    }
  },

  // Get guild details
  getGuild: async (guildId, token) => {
    try {
      const response = await axios.get(`https://discord.com/api/guilds/${guildId}`, {
        headers: {
          Authorization: `Bot ${token}`,
        },
      })
      return response.data
    } catch (error) {
      console.error(`Error fetching guild ${guildId}:`, error)
      throw error
    }
  },

  // Get guild channels
  getGuildChannels: async (guildId, token) => {
    try {
      const response = await axios.get(`https://discord.com/api/guilds/${guildId}/channels`, {
        headers: {
          Authorization: `Bot ${token}`,
        },
      })
      return response.data
    } catch (error) {
      console.error(`Error fetching channels for guild ${guildId}:`, error)
      throw error
    }
  },
}

// Database API helper
export const dbAPI = {
  // Get guild configuration from database
  getGuildConfig: async (guildId) => {
    return fetchAPI(`/api/database/guilds/${guildId}`)
  },

  // Update guild configuration in database
  updateGuildConfig: async (guildId, config) => {
    return fetchAPI(`/api/database/guilds/${guildId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(config),
    })
  },

  // Get guild statistics from database
  getGuildStats: async (guildId) => {
    return fetchAPI(`/api/database/guilds/${guildId}/stats`)
  },
}

