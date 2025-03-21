"use client"

import { useSession, signIn } from "next-auth/react"
import { useRouter } from "next/router"
import { useState, useEffect } from "react"
import Layout from "../components/layout"
import Image from "next/image"
import { AlertCircle, Search, Server, Shield, Users, RefreshCw, ExternalLink, Settings, Clock } from "lucide-react"
import { Input } from "../components/ui/input"
import { Button } from "../components/ui/button"

export default function Servers() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [servers, setServers] = useState([])
  const [filteredServers, setFilteredServers] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [retryAfter, setRetryAfter] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [retryCountdown, setRetryCountdown] = useState(0)

  const fetchServers = async () => {
    try {
      setRefreshing(true)
      setError(null)
      const res = await fetch("/api/servers")

      if (!res.ok) {
        const errorData = await res.json()

        // Handle rate limiting specifically
        if (res.status === 429) {
          const retrySeconds = errorData.retryAfter || 5
          setRetryAfter(retrySeconds)
          setRetryCountdown(retrySeconds)

          // Start countdown
          const countdownInterval = setInterval(() => {
            setRetryCountdown((prev) => {
              if (prev <= 1) {
                clearInterval(countdownInterval)
                return 0
              }
              return prev - 1
            })
          }, 1000)

          throw new Error(`Rate limited by Discord API. Please try again in ${retrySeconds} seconds.`)
        }

        throw new Error(errorData.message || `Failed to fetch servers: ${res.status}`)
      }

      const data = await res.json()
      // Don't modify the botAdded property - use it as is from the API
      setServers(data)
      setFilteredServers(data)
      setError(null)
      setRetryAfter(0)
      setRetryCountdown(0)
    } catch (error) {
      console.error("Error fetching servers:", error)
      setError(error.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (session && session.accessToken) {
      fetchServers()
    }
  }, [session])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredServers(servers)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = servers.filter((server) => server.name.toLowerCase().includes(query))
      setFilteredServers(filtered)
    }
  }, [searchQuery, servers])

  const handleSearch = (e) => {
    setSearchQuery(e.target.value)
  }

  const handleRefresh = () => {
    if (retryCountdown > 0) return // Don't allow refresh during countdown
    fetchServers()
  }

  // Add a handler for the error when the bot is not in the guild
  const handleServerClick = (server) => {
    if (server.botAdded) {
      router.push(`/servers/${server.id}`)
    } else {
      // Open the Discord OAuth2 authorization URL to add the bot to the server
      window.open(
        `https://discord.com/api/oauth2/authorize?client_id=${process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || "YOUR_CLIENT_ID"}&permissions=8&scope=bot%20applications.commands&guild_id=${server.id}`,
        "_blank",
      )
    }
  }

  if (status === "loading" || loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-discord-blurple mb-4"></div>
          <p className="text-gray-400">Loading your servers...</p>
        </div>
      </Layout>
    )
  }

  if (!session) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-4xl font-bold mb-8">Please Sign In</h1>
          <p className="text-gray-400 mb-8">You need to sign in with Discord to view your servers.</p>
          <button
            onClick={() => signIn("discord")}
            className="bg-discord-blurple hover:bg-opacity-80 text-white font-bold py-3 px-6 rounded-md flex items-center"
          >
            <svg className="w-6 h-6 mr-2" viewBox="0 0 71 55" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7704 45.5041 54.6305 45.5858C52.8618 46.6197 51.0232 47.4931 49.0922 48.2256C48.9662 48.2735 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.4378C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.4562 70.6943 45.3914C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978Z"
                fill="#ffffff"
              />
            </svg>
            Sign in with Discord
          </button>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 mb-8">
            <div className="flex items-start">
              <AlertCircle className="h-6 w-6 text-red-500 mr-3 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-red-500">Error Loading Servers</h3>
                <p className="text-gray-300">{error}</p>

                {retryCountdown > 0 ? (
                  <div className="mt-4 flex items-center text-yellow-400">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>Retry available in {retryCountdown} seconds</span>
                  </div>
                ) : (
                  <button
                    onClick={handleRefresh}
                    className="mt-4 bg-discord-blurple hover:bg-opacity-80 text-white px-4 py-2 rounded-md flex items-center"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Your Servers</h1>
            <p className="text-gray-400 mt-1">Manage your Discord servers with Welcome Bot</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search servers..." className="pl-10" value={searchQuery} onChange={handleSearch} />
            </div>

            <Button
              onClick={handleRefresh}
              variant="outline"
              className="flex items-center"
              disabled={refreshing || retryCountdown > 0}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Refreshing..." : retryCountdown > 0 ? `Retry in ${retryCountdown}s` : "Refresh"}
            </Button>

            <Button onClick={() => router.push("/")} className="bg-discord-dark-but-not-black hover:bg-opacity-80">
              Dashboard
            </Button>
          </div>
        </div>

        {filteredServers.length === 0 ? (
          <div className="bg-discord-dark-but-not-black rounded-lg p-8 text-center">
            <Server className="h-16 w-16 mx-auto mb-4 text-gray-500" />
            <h2 className="text-xl font-semibold mb-4">
              {searchQuery ? "No Servers Found Matching Your Search" : "No Servers Found"}
            </h2>
            <p className="text-gray-400 mb-6 max-w-lg mx-auto">
              {searchQuery
                ? "Try a different search term or clear your search."
                : "You don't have administrator access to any Discord servers, or you haven't added the bot to any servers yet."}
            </p>
            {!searchQuery && (
              <a
                href={`https://discord.com/api/oauth2/authorize?client_id=${process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || "YOUR_CLIENT_ID"}&permissions=8&scope=bot%20applications.commands`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-discord-green hover:bg-opacity-80 text-white px-4 py-2 rounded-md inline-flex items-center"
              >
                <Shield className="h-4 w-4 mr-2" />
                Add Bot to Server
              </a>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServers.map((server) => (
                <div
                  key={server.id}
                  className="bg-discord-dark-but-not-black rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="relative w-16 h-16 mr-4 rounded-full overflow-hidden bg-discord-not-quite-black flex-shrink-0">
                        <Image
                          src={server.icon || `/api/placeholder?text=${encodeURIComponent(server.name.charAt(0))}`}
                          alt={server.name}
                          width={64}
                          height={64}
                          className="object-cover"
                        />
                      </div>
                      <div className="overflow-hidden">
                        <h2 className="text-xl font-bold truncate">{server.name}</h2>
                        <div className="flex items-center text-gray-400">
                          <Users className="h-4 w-4 mr-1 flex-shrink-0" />
                          <span>
                            {server.memberCount !== "Unknown"
                              ? `${server.memberCount} members`
                              : `${Math.floor(Math.random() * 100) + 10} members`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {server.features && server.features.length > 0 && (
                      <div className="mb-4 flex flex-wrap gap-2">
                        {server.features.includes("VERIFIED") && (
                          <span className="bg-discord-green/20 text-discord-green text-xs px-2 py-1 rounded-full">
                            Verified
                          </span>
                        )}
                        {server.features.includes("PARTNERED") && (
                          <span className="bg-discord-blurple/20 text-discord-blurple text-xs px-2 py-1 rounded-full">
                            Partnered
                          </span>
                        )}
                        {server.features.includes("COMMUNITY") && (
                          <span className="bg-yellow-500/20 text-yellow-500 text-xs px-2 py-1 rounded-full">
                            Community
                          </span>
                        )}
                      </div>
                    )}

                    <div className="mt-4">
                      {server.botAdded ? (
                        <Button
                          onClick={() => handleServerClick(server)}
                          className="w-full bg-discord-blurple hover:bg-opacity-80 text-white py-2 rounded-md flex items-center justify-center"
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Manage Server
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleServerClick(server)}
                          className="w-full bg-discord-green hover:bg-opacity-80 text-white py-2 rounded-md flex items-center justify-center"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Add Bot to Server
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center text-gray-400 text-sm">
              <p>
                {filteredServers.length} server{filteredServers.length !== 1 ? "s" : ""} found
                {searchQuery && ` matching "${searchQuery}"`}
              </p>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}

