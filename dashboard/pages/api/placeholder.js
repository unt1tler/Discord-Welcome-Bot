// Simple API route to generate placeholder images
export default function handler(req, res) {
  const { text = "?", size = 128, bg = "5865F2", fg = "FFFFFF" } = req.query

  // Create an SVG placeholder
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="#${bg}"/>
      <text 
        x="50%" 
        y="50%" 
        font-family="Arial, sans-serif" 
        font-size="${size / 2}px" 
        fill="#${fg}" 
        text-anchor="middle" 
        dominant-baseline="middle"
      >
        ${text.charAt(0).toUpperCase()}
      </text>
    </svg>
  `

  res.setHeader("Content-Type", "image/svg+xml")
  res.status(200).send(svg)
}

