// Date utility functions
const { format } = require("date-fns")

// Format a date to a readable string
function formatDate(date) {
  if (!date) return "Unknown"
  return format(date, "PPP") // e.g., "April 29th, 2023"
}

// Calculate duration between two dates in a human-readable format
function calculateDuration(startDate, endDate = new Date()) {
  if (!startDate) return "Unknown"

  const diffInMs = Math.abs(endDate - startDate)
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  if (diffInDays < 1) {
    return "Less than a day"
  } else if (diffInDays === 1) {
    return "1 day"
  } else if (diffInDays < 30) {
    return `${diffInDays} days`
  } else if (diffInDays < 365) {
    const months = Math.floor(diffInDays / 30)
    return months === 1 ? "1 month" : `${months} months`
  } else {
    const years = Math.floor(diffInDays / 365)
    const remainingMonths = Math.floor((diffInDays % 365) / 30)

    if (remainingMonths === 0) {
      return years === 1 ? "1 year" : `${years} years`
    } else {
      return years === 1
        ? `1 year and ${remainingMonths} ${remainingMonths === 1 ? "month" : "months"}`
        : `${years} years and ${remainingMonths} ${remainingMonths === 1 ? "month" : "months"}`
    }
  }
}

// Check if a date is an anniversary of another date
function isAnniversary(originalDate, checkDate = new Date(), intervals = [30, 90, 180, 365]) {
  if (!originalDate) return false

  const diffInMs = Math.abs(checkDate - originalDate)
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  // Check if today is an anniversary based on the intervals
  for (const interval of intervals) {
    if (diffInDays % interval === 0 && diffInDays > 0) {
      return {
        isAnniversary: true,
        days: diffInDays,
        interval: interval,
      }
    }
  }

  return { isAnniversary: false }
}

module.exports = {
  formatDate,
  calculateDuration,
  isAnniversary,
}

