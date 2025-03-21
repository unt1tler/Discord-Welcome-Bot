"use client"

import { useState, useEffect } from "react"
import { getSessionSafely } from "../../lib/session"

const Servers = () => {
  const [servers, setServers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchSession = async () => {
      const session = await getSessionSafely()
      if (!session) {
        // Handle missing session
        setLoading(false)
        setError("Please sign in to view your servers")
        return
      }

      // Simulate fetching servers data
      setTimeout(() => {
        setServers([
          { id: 1, name: "Server 1", status: "Online" },
          { id: 2, name: "Server 2", status: "Offline" },
        ])
        setLoading(false)
      }, 1000)
    }

    fetchSession()
  }, [])

  if (loading) {
    return <p>Loading servers...</p>
  }

  if (error) {
    return <p>Error: {error}</p>
  }

  return (
    <div>
      <h1>Servers</h1>
      <ul>
        {servers.map((server) => (
          <li key={server.id}>
            {server.name} - Status: {server.status}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default Servers

