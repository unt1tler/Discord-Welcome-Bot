// Create a utility function to handle session fetching with error handling

// Add this file if it doesn't exist, or update it if it does
import { getSession } from "next-auth/react"

/**
 * Get the user session with error handling
 * @param {Object} req - The request object
 * @returns {Promise<Object|null>} The session object or null
 */
export async function getSessionSafely(req) {
  try {
    return await getSession({ req })
  } catch (error) {
    console.error("Error fetching session:", error)
    return null
  }
}

/**
 * Check if a user is authenticated
 * @param {Object} req - The request object
 * @returns {Promise<boolean>} Whether the user is authenticated
 */
export async function isAuthenticated(req) {
  const session = await getSessionSafely(req)
  return !!session
}

export default {
  getSessionSafely,
  isAuthenticated,
}

