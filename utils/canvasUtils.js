// Canvas utility functions for image manipulation
let canvas
let createCanvas
let loadImage
let registerFont
let isCanvasAvailable = false

// Try to load the canvas module, but make it optional
try {
  const canvasModule = require("canvas")
  canvas = canvasModule
  createCanvas = canvasModule.createCanvas
  loadImage = canvasModule.loadImage
  registerFont = canvasModule.registerFont
  isCanvasAvailable = true
  console.log("Canvas module loaded successfully")
} catch (error) {
  console.log("Canvas module not available. Image generation features will be disabled.")
  // Create dummy functions that return null when canvas is not available
  createCanvas = () => null
  loadImage = () => Promise.resolve(null)
  registerFont = () => null
}

const { formatDate } = require("./dateUtils")
const config = require("../config")

// Create a welcome card with user avatar, name, and server info
async function createWelcomeCard(member, options = {}) {
  // If canvas is not available, return null
  if (!isCanvasAvailable) {
    console.log("Canvas module not available. Cannot create welcome card.")
    return null
  }

  try {
    const canvas = createCanvas(1000, 360)
    const ctx = canvas.getContext("2d")

    // Set default options from config
    const defaultOptions = {
      ...config.defaultCanvasOptions.welcome,
      showAvatar: true,
      avatarBorderColor: "#ffffff",
      showMemberCount: true,
      showJoinDate: true,
      message: `Welcome to ${member.guild.name}`,
    }

    // Merge with provided options
    const opts = { ...defaultOptions, ...options }

    // Draw background with gradient
    ctx.fillStyle = opts.backgroundColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Create gradient for the sidebar
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0, opts.gradientStart)
    gradient.addColorStop(1, opts.gradientEnd)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 8, canvas.height)

    // Add server name at the top
    ctx.font = "bold 28px sans-serif"
    ctx.fillStyle = opts.accentColor || opts.gradientStart
    ctx.textAlign = "left"
    ctx.fillText(member.guild.name, 30, 50)

    // Draw a separator line
    ctx.strokeStyle = opts.accentColor || opts.gradientStart
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(30, 65)
    ctx.lineTo(canvas.width - 30, 65)
    ctx.stroke()

    // Add welcome message
    ctx.font = "bold 42px sans-serif"
    ctx.fillStyle = opts.textColor
    ctx.textAlign = "center"
    ctx.fillText(opts.message, canvas.width / 2, 130)

    // Add username
    ctx.font = "bold 32px sans-serif"
    ctx.fillStyle = opts.accentColor || opts.gradientStart
    ctx.textAlign = "center"
    ctx.fillText(member.user.tag, canvas.width / 2, 180)

    // Draw user avatar if enabled
    if (opts.showAvatar) {
      try {
        // Draw avatar circle
        ctx.save()
        ctx.beginPath()
        const centerX = canvas.width / 2
        const centerY = 260
        const radius = 70
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, true)
        ctx.closePath()
        ctx.clip()

        // Load and draw avatar
        const avatar = await loadImage(member.user.displayAvatarURL({ extension: "png", size: 256, forceStatic: true }))
        ctx.drawImage(avatar, centerX - radius, centerY - radius, radius * 2, radius * 2)
        ctx.restore()

        // Draw avatar border
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius + 2, 0, Math.PI * 2, true)
        ctx.strokeStyle = opts.avatarBorderColor
        ctx.lineWidth = 4
        ctx.stroke()
      } catch (error) {
        console.error("Error loading avatar:", error)
      }
    }

    // Add info text at the bottom
    ctx.font = "18px sans-serif"
    ctx.fillStyle = opts.textColor
    ctx.textAlign = "left"

    const infoY = canvas.height - 30
    let infoText = ""

    if (opts.showMemberCount) {
      infoText += `You are member #${member.guild.memberCount}`
    }

    if (opts.showJoinDate) {
      if (infoText) infoText += " • "
      infoText += `Joined: ${formatDate(member.joinedAt)}`
    }

    if (infoText) {
      ctx.fillText(infoText, 30, infoY)
    }

    // Add timestamp at bottom right
    ctx.textAlign = "right"
    ctx.fillText(new Date().toLocaleString(), canvas.width - 30, infoY)

    return canvas.toBuffer()
  } catch (error) {
    console.error("Error creating welcome card:", error)
    return null
  }
}

// Create a leave card with user avatar and information
async function createLeaveCard(member, options = {}) {
  // If canvas is not available, return null
  if (!isCanvasAvailable) {
    console.log("Canvas module not available. Cannot create leave card.")
    return null
  }

  try {
    const canvas = createCanvas(1000, 360)
    const ctx = canvas.getContext("2d")

    // Set default options from config
    const defaultOptions = {
      ...config.defaultCanvasOptions.leave,
      showAvatar: true,
      avatarBorderColor: "#ffffff",
      showDuration: true,
      message: `Goodbye from ${member.guild.name}`,
    }

    // Merge with provided options
    const opts = { ...defaultOptions, ...options }

    // Draw background with gradient
    ctx.fillStyle = opts.backgroundColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Create gradient for the sidebar
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0, opts.gradientStart)
    gradient.addColorStop(1, opts.gradientEnd)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 8, canvas.height)

    // Add server name at the top
    ctx.font = "bold 28px sans-serif"
    ctx.fillStyle = opts.accentColor || opts.gradientStart
    ctx.textAlign = "left"
    ctx.fillText(member.guild.name, 30, 50)

    // Draw a separator line
    ctx.strokeStyle = opts.accentColor || opts.gradientStart
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(30, 65)
    ctx.lineTo(canvas.width - 30, 65)
    ctx.stroke()

    // Add leave message
    ctx.font = "bold 42px sans-serif"
    ctx.fillStyle = opts.textColor
    ctx.textAlign = "center"
    ctx.fillText(opts.message, canvas.width / 2, 130)

    // Add username
    ctx.font = "bold 32px sans-serif"
    ctx.fillStyle = opts.accentColor || opts.gradientStart
    ctx.textAlign = "center"
    ctx.fillText(member.user.tag, canvas.width / 2, 180)

    // Draw user avatar if enabled
    if (opts.showAvatar) {
      try {
        // Draw avatar circle
        ctx.save()
        ctx.beginPath()
        const centerX = canvas.width / 2
        const centerY = 260
        const radius = 70
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, true)
        ctx.closePath()
        ctx.clip()

        // Load and draw avatar
        const avatar = await loadImage(member.user.displayAvatarURL({ extension: "png", size: 256, forceStatic: true }))
        ctx.drawImage(avatar, centerX - radius, centerY - radius, radius * 2, radius * 2)
        ctx.restore()

        // Draw avatar border
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius + 2, 0, Math.PI * 2, true)
        ctx.strokeStyle = opts.avatarBorderColor
        ctx.lineWidth = 4
        ctx.stroke()
      } catch (error) {
        console.error("Error loading avatar:", error)
      }
    }

    // Add info text at the bottom
    ctx.font = "18px sans-serif"
    ctx.fillStyle = opts.textColor
    ctx.textAlign = "left"

    const infoY = canvas.height - 30
    let infoText = ""

    if (opts.showDuration && member.joinedAt) {
      const joinDate = member.joinedAt
      const leaveDate = new Date()
      const durationDays = Math.floor((leaveDate - joinDate) / (1000 * 60 * 60 * 24))
      infoText += `Was a member for ${durationDays} days`
    }

    if (infoText) {
      ctx.fillText(infoText, 30, infoY)
    }

    // Add timestamp at bottom right
    ctx.textAlign = "right"
    ctx.fillText(new Date().toLocaleString(), canvas.width - 30, infoY)

    return canvas.toBuffer()
  } catch (error) {
    console.error("Error creating leave card:", error)
    return null
  }
}

// Create a milestone card (for member count achievements)
async function createMilestoneCard(guild, memberCount, options = {}) {
  // If canvas is not available, return null
  if (!isCanvasAvailable) {
    console.log("Canvas module not available. Cannot create milestone card.")
    return null
  }

  try {
    const canvas = createCanvas(1000, 360)
    const ctx = canvas.getContext("2d")

    // Set default options
    const defaultOptions = {
      backgroundColor: "#23272a",
      gradientStart: "#faa61a",
      gradientEnd: "#e67e22",
      textColor: "#ffffff",
      accentColor: "#faa61a",
      message: `We've reached ${memberCount} members!`,
    }

    // Merge with provided options
    const opts = { ...defaultOptions, ...options }

    // Draw background with gradient
    ctx.fillStyle = opts.backgroundColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Create gradient for the sidebar
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0, opts.gradientStart)
    gradient.addColorStop(1, opts.gradientEnd)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 8, canvas.height)

    // Add server name at the top
    ctx.font = "bold 28px sans-serif"
    ctx.fillStyle = opts.accentColor
    ctx.textAlign = "left"
    ctx.fillText(guild.name, 30, 50)

    // Draw a separator line
    ctx.strokeStyle = opts.accentColor
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(30, 65)
    ctx.lineTo(canvas.width - 30, 65)
    ctx.stroke()

    // Add milestone announcement
    ctx.font = "bold 42px sans-serif"
    ctx.fillStyle = opts.textColor
    ctx.textAlign = "center"
    ctx.fillText("Milestone Reached!", canvas.width / 2, 130)

    // Add member count
    ctx.font = "bold 72px sans-serif"
    ctx.fillStyle = opts.accentColor
    ctx.textAlign = "center"
    ctx.fillText(memberCount.toString(), canvas.width / 2, 220)

    // Add message
    ctx.font = "32px sans-serif"
    ctx.fillStyle = opts.textColor
    ctx.textAlign = "center"
    ctx.fillText(opts.message, canvas.width / 2, 280)

    // Add timestamp at bottom right
    ctx.font = "18px sans-serif"
    ctx.textAlign = "right"
    ctx.fillText(new Date().toLocaleString(), canvas.width - 30, canvas.height - 30)

    return canvas.toBuffer()
  } catch (error) {
    console.error("Error creating milestone card:", error)
    return null
  }
}

module.exports = {
  createWelcomeCard,
  createLeaveCard,
  createMilestoneCard,
  isCanvasAvailable,
}

