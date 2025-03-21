// Rate limiting utility for Discord bot commands
const { Ratelimit } = require("@upstash/ratelimit")
const { Redis } = require("@upstash/redis")

// Check if Upstash Redis environment variables are available
const hasUpstashRedis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN

// Initialize Redis client if credentials are available
let redis
const ratelimits = {}

if (hasUpstashRedis) {
  try {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    console.log("Upstash Redis client initialized for rate limiting")
  } catch (error) {
    console.error("Failed to initialize Upstash Redis client:", error)
  }
}

/**
 * Creates a rate limiter for a specific command
 * @param {string} command - The command name
 * @param {number} limit - Number of requests allowed
 * @param {string} window - Time window (e.g., "10 s", "1 m", "1 h")
 * @returns {Object} - Rate limiter object
 */
function createRateLimiter(command, limit = 5, window = "10 s") {
  if (!redis) {
    // Return a dummy rate limiter if Redis is not available
    return {
      limit: async () => ({ success: true, remaining: 999 }),
      pending: Promise.resolve(),
    }
  }

  try {
    // Create a sliding window rate limiter
    const rateLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, window),
      analytics: true,
      prefix: `discord_bot_ratelimit:${command}`,
      enableProtection: true, // Enable traffic protection [^1]
    })

    ratelimits[command] = rateLimiter
    return rateLimiter
  } catch (error) {
    console.error(`Failed to create rate limiter for ${command}:`, error)
    // Return a dummy rate limiter if creation fails
    return {
      limit: async () => ({ success: true, remaining: 999 }),
      pending: Promise.resolve(),
    }
  }
}

/**
 * Check if a user is rate limited for a command
 * @param {string} command - The command name
 * @param {string} userId - The user's Discord ID
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - Rate limit result
 */
async function isRateLimited(command, userId, options = {}) {
  // Get or create rate limiter for this command
  const rateLimiter = ratelimits[command] || createRateLimiter(command)

  try {
    // Check rate limit
    const identifier = `${userId}:${command}`
    const result = await rateLimiter.limit(identifier, options)

    // Wait for pending operations if analytics is enabled
    if (result.pending) {
      await result.pending
    }

    return {
      limited: !result.success,
      remaining: result.remaining,
      reset: result.reset,
      limit: result.limit,
    }
  } catch (error) {
    console.error(`Rate limit check failed for ${command}:`, error)
    // Don't rate limit on errors
    return { limited: false, remaining: 999 }
  }
}

/**
 * Configure rate limits for different commands
 */
function setupRateLimits() {
  // Common commands
  createRateLimiter("welcome", 5, "1 m")
  createRateLimiter("leave", 5, "1 m")
  createRateLimiter("help", 10, "1 m")
  createRateLimiter("config", 5, "1 m")
  createRateLimiter("role", 10, "1 m")

  // More strict limits for admin commands
  createRateLimiter("admin", 3, "1 m")
}

module.exports = {
  isRateLimited,
  createRateLimiter,
  setupRateLimits,
}

