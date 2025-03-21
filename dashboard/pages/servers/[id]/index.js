"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/router"
import { useState, useEffect } from "react"
import Layout from "../../../components/layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Switch } from "../../../components/ui/switch"
import { Label } from "../../../components/ui/label"
import {
  UserPlus,
  UserMinus,
  MessageSquare,
  Settings,
  RefreshCw,
  AlertCircle,
  ArrowLeft,
  Calendar,
  Shield,
  Users,
} from "lucide-react"
import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import { getSessionSafely } from "../../../lib/session"

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

export default function ServerDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { id } = router.query
  const [server, setServer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [dataSource, setDataSource] = useState("loading")

  const fetchServerData = async () => {
    if (!id) return

    try {
      setRefreshing(true)
      const res = await fetch(`/api/servers/${id}`)

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || `Failed to fetch server data: ${res.status}`)
      }

      const data = await res.json()
      setServer(data)
      setDataSource(data.dataSource || "unknown")
      setError(null)
    } catch (error) {
      console.error("Error fetching server data:", error)
      setError(error.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const session = await getSessionSafely()
        if (id && session) {
          fetchServerData()
        }
      } catch (sessionError) {
        console.error("Session error:", sessionError)
        setError("Failed to retrieve session. Please try again.")
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  // Add a refresh interval to keep data updated
  useEffect(() => {
    // Initial fetch
    fetchServerData()

    // Set up interval for periodic refresh (every 30 seconds)
    const refreshInterval = setInterval(() => {
      fetchServerData()
    }, 30000)

    // Clean up interval on component unmount
    return () => clearInterval(refreshInterval)
  }, [])

  const handleRefresh = () => {
    fetchServerData()
  }

  const handleToggleWelcome = async () => {
    if (!server) return

    try {
      const updatedConfig = {
        ...server.config.welcome,
        enabled: !server.config.welcome.enabled,
      }

      const res = await fetch(`/api/servers/${id}/welcome`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedConfig),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to update welcome settings")
      }

      // Update local state
      setServer({
        ...server,
        config: {
          ...server.config,
          welcome: {
            ...server.config.welcome,
            enabled: !server.config.welcome.enabled,
          },
        },
      })
    } catch (error) {
      console.error("Error updating welcome settings:", error)
      setError(error.message)
    }
  }

  const handleToggleLeave = async () => {
    if (!server) return

    try {
      const updatedConfig = {
        ...server.config.leave,
        enabled: !server.config.leave.enabled,
      }

      const res = await fetch(`/api/servers/${id}/leave`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedConfig),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to update leave settings")
      }

      // Update local state
      setServer({
        ...server,
        config: {
          ...server.config,
          leave: {
            ...server.config.leave,
            enabled: !server.config.leave.enabled,
          },
        },
      })
    } catch (error) {
      console.error("Error updating leave settings:", error)
      setError(error.message)
    }
  }

  const handleToggleAutoRole = async () => {
    if (!server) return

    try {
      const updatedConfig = {
        ...server.config.roles,
        enabled: !server.config.roles.enabled,
      }

      const res = await fetch(`/api/servers/${id}/roles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedConfig),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to update auto-role settings")
      }

      // Update local state
      setServer({
        ...server,
        config: {
          ...server.config,
          roles: {
            ...server.config.roles,
            enabled: !server.config.roles.enabled,
          },
        },
      })
    } catch (error) {
      console.error("Error updating auto-role settings:", error)
      setError(error.message)
    }
  }

  const handleToggleMilestones = async () => {
    if (!server) return

    try {
      const updatedConfig = {
        ...server.config.events,
        milestones: {
          ...server.config.events.milestones,
          enabled: !server.config.events.milestones.enabled,
        },
      }

      const res = await fetch(`/api/servers/${id}/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedConfig),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to update milestone settings")
      }

      // Update local state
      setServer({
        ...server,
        config: {
          ...server.config,
          events: {
            ...server.config.events,
            milestones: {
              ...server.config.events.milestones,
              enabled: !server.config.events.milestones.enabled,
            },
          },
        },
      })
    } catch (error) {
      console.error("Error updating milestone settings:", error)
      setError(error.message)
    }
  }

  const handleToggleAnniversaries = async () => {
    if (!server) return

    try {
      const updatedConfig = {
        ...server.config.events,
        anniversaries: {
          ...server.config.events.anniversaries,
          enabled: !server.config.events.anniversaries.enabled,
        },
      }

      const res = await fetch(`/api/servers/${id}/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedConfig),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to update anniversary settings")
      }

      // Update local state
      setServer({
        ...server,
        config: {
          ...server.config,
          events: {
            ...server.config.events,
            anniversaries: {
              ...server.config.events.anniversaries,
              enabled: !server.config.events.anniversaries.enabled,
            },
          },
        },
      })
    } catch (error) {
      console.error("Error updating anniversary settings:", error)
      setError(error.message)
    }
  }

  const handleRemoveAutoRole = async (roleId) => {
    if (!server) return

    try {
      const updatedAutoAssign = server.config.roles.autoAssign.filter((id) => id !== roleId)

      const updatedConfig = {
        ...server.config.roles,
        autoAssign: updatedAutoAssign,
      }

      const res = await fetch(`/api/servers/${id}/roles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedConfig),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to update auto-role settings")
      }

      // Update local state
      setServer({
        ...server,
        config: {
          ...server.config,
          roles: {
            ...server.config.roles,
            autoAssign: updatedAutoAssign,
          },
        },
      })
    } catch (error) {
      console.error("Error removing auto-role:", error)
      setError(error.message)
    }
  }

  const handleRemoveSelfRole = async (roleId) => {
    if (!server) return

    try {
      const updatedSelfAssignable = server.config.roles.selfAssignable.filter((id) => id !== roleId)

      const updatedConfig = {
        ...server.config.roles,
        selfAssignable: updatedSelfAssignable,
      }

      const res = await fetch(`/api/servers/${id}/roles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedConfig),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to update self-role settings")
      }

      // Update local state
      setServer({
        ...server,
        config: {
          ...server.config,
          roles: {
            ...server.config.roles,
            selfAssignable: updatedSelfAssignable,
          },
        },
      })
    } catch (error) {
      console.error("Error removing self-role:", error)
      setError(error.message)
    }
  }

  if (status === "loading" || loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-discord-blurple mb-4"></div>
          <p className="text-gray-400">Loading server data...</p>
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
                <h3 className="text-lg font-semibold text-red-500">Error Loading Server</h3>
                <p className="text-gray-300">{error}</p>
                <div className="mt-4 flex space-x-4">
                  <Button onClick={handleRefresh} className="bg-discord-blurple hover:bg-opacity-80 text-white">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                  <Button onClick={() => router.push("/servers")} className="bg-gray-700 hover:bg-gray-600 text-white">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Servers
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (!server) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-discord-dark-but-not-black p-6 rounded-lg shadow-lg">
            <div className="flex items-start">
              <AlertCircle className="h-6 w-6 text-red-500 mr-3 mt-0.5" />
              <div>
                <h1 className="text-2xl font-bold mb-4">Server not found</h1>
                <p className="mb-4">The server you're looking for doesn't exist or you don't have access to it.</p>
                <Button
                  onClick={() => router.push("/servers")}
                  className="bg-discord-blurple hover:bg-opacity-80 text-white"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Servers
                </Button>
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
          <div className="flex items-center">
            {server.icon ? (
              <img
                src={server.icon || "/placeholder.svg"}
                alt={server.name}
                className="w-12 h-12 rounded-full mr-4 border border-gray-700"
              />
            ) : (
              <div className="w-12 h-12 rounded-full mr-4 bg-discord-blurple flex items-center justify-center text-white font-bold text-xl">
                {server.name.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold">{server.name}</h1>
              <div className="flex items-center text-gray-400">
                <Users className="h-4 w-4 mr-1" />
                <span>{server.memberCount} members</span>
                {server.config.welcome.enabled && (
                  <span className="ml-3 bg-green-500/20 text-green-500 text-xs px-2 py-1 rounded-full">
                    Welcome Active
                  </span>
                )}
                {server.config.leave.enabled && (
                  <span className="ml-3 bg-red-500/20 text-red-500 text-xs px-2 py-1 rounded-full">Leave Active</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={handleRefresh} variant="outline" className="flex items-center" disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>
            <Button
              onClick={() => router.push("/servers")}
              className="bg-discord-dark-but-not-black hover:bg-opacity-80 flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Servers
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-red-500">{error}</p>
            </div>
          </div>
        )}

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="welcome">Welcome Messages</TabsTrigger>
            <TabsTrigger value="leave">Leave Messages</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <UserPlus className="w-5 h-5 mr-2 text-discord-green" />
                    Joins Today
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{server.stats.joins.today || 0}</p>
                  <p className="text-sm text-gray-400">Total: {server.stats.joins.total || 0}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <UserMinus className="w-5 h-5 mr-2 text-discord-red" />
                    Leaves Today
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{server.stats.leaves.today || 0}</p>
                  <p className="text-sm text-gray-400">Total: {server.stats.leaves.total || 0}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <UserPlus className="w-5 h-5 mr-2 text-discord-green" />
                    Weekly Joins
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{server.stats.joins.week || 0}</p>
                  <p className="text-sm text-gray-400">This week</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <UserMinus className="w-5 h-5 mr-2 text-discord-red" />
                    Weekly Leaves
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{server.stats.leaves.week || 0}</p>
                  <p className="text-sm text-gray-400">This week</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Member Activity</CardTitle>
                <CardDescription>Joins and leaves over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <Line
                    data={server.stats.joinLeaveData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          grid: {
                            color: "rgba(255, 255, 255, 0.1)",
                          },
                          ticks: {
                            color: "rgba(255, 255, 255, 0.7)",
                            precision: 0, // Only show whole numbers
                            callback: (value) => {
                              if (value % 1 === 0) {
                                return value
                              }
                            },
                          },
                        },
                        x: {
                          grid: {
                            color: "rgba(255, 255, 255, 0.1)",
                          },
                          ticks: {
                            color: "rgba(255, 255, 255, 0.7)",
                          },
                        },
                      },
                      plugins: {
                        legend: {
                          position: "top",
                          labels: {
                            color: "rgba(255, 255, 255, 0.7)",
                            boxWidth: 15,
                            padding: 15,
                          },
                        },
                        tooltip: {
                          backgroundColor: "rgba(0, 0, 0, 0.8)",
                          titleColor: "rgba(255, 255, 255, 0.9)",
                          bodyColor: "rgba(255, 255, 255, 0.9)",
                          callbacks: {
                            label: (context) => {
                              let label = context.dataset.label || ""
                              if (label) {
                                label += ": "
                              }
                              if (context.parsed.y !== null) {
                                label += Math.round(context.parsed.y) // Ensure whole numbers
                              }
                              return label
                            },
                          },
                        },
                      },
                      animation: {
                        duration: 1000, // Smoother animations
                      },
                      elements: {
                        point: {
                          radius: 3,
                          hoverRadius: 5,
                        },
                        line: {
                          borderWidth: 2,
                        },
                      },
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2 text-discord-green" />
                    Welcome Message
                  </CardTitle>
                  <CardDescription className="flex items-center justify-between">
                    <span>
                      {server.config.welcome.enabled ? "Enabled" : "Disabled"} • Mode: {server.config.welcome.mode}
                    </span>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="welcome-toggle" className="sr-only">
                        Toggle welcome messages
                      </Label>
                      <Switch
                        id="welcome-toggle"
                        checked={server.config.welcome.enabled}
                        onCheckedChange={handleToggleWelcome}
                      />
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-discord-not-quite-black p-4 rounded-md">
                    {server.config.welcome.mode === "embed" ? (
                      <div className="border-l-4 border-green-500 pl-3 py-2">
                        <p className="font-semibold text-green-400">{server.config.welcome.embed.title}</p>
                        <p className="text-gray-300">{server.config.welcome.embed.description}</p>
                        <p className="text-xs text-gray-400 mt-2">{server.config.welcome.embed.footer}</p>
                      </div>
                    ) : (
                      <p className="text-gray-300">{server.config.welcome.text}</p>
                    )}
                  </div>
                  <Button
                    onClick={() => router.push(`/servers/${id}/welcome`)}
                    className="mt-4 text-discord-green hover:underline text-sm font-medium"
                    variant="link"
                  >
                    Edit Welcome Message →
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2 text-discord-red" />
                    Leave Message
                  </CardTitle>
                  <CardDescription className="flex items-center justify-between">
                    <span>
                      {server.config.leave.enabled ? "Enabled" : "Disabled"} • Mode: {server.config.leave.mode}
                    </span>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="leave-toggle" className="sr-only">
                        Toggle leave messages
                      </Label>
                      <Switch
                        id="leave-toggle"
                        checked={server.config.leave.enabled}
                        onCheckedChange={handleToggleLeave}
                      />
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-discord-not-quite-black p-4 rounded-md">
                    {server.config.leave.mode === "embed" ? (
                      <div className="border-l-4 border-red-500 pl-3 py-2">
                        <p className="font-semibold text-red-400">{server.config.leave.embed.title}</p>
                        <p className="text-gray-300">{server.config.leave.embed.description}</p>
                        <p className="text-xs text-gray-400 mt-2">{server.config.leave.embed.footer}</p>
                      </div>
                    ) : (
                      <p className="text-gray-300">{server.config.leave.text}</p>
                    )}
                  </div>
                  <Button
                    onClick={() => router.push(`/servers/${id}/leave`)}
                    className="mt-4 text-discord-red hover:underline text-sm font-medium"
                    variant="link"
                  >
                    Edit Leave Message →
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="welcome">
            <Card>
              <CardHeader>
                <CardTitle>Welcome Message Configuration</CardTitle>
                <CardDescription>Customize how new members are greeted when they join your server</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium">Welcome Messages</h3>
                      <p className="text-sm text-gray-400">Send customized messages when users join your server</p>
                    </div>
                    <Switch
                      id="welcome-toggle-tab"
                      checked={server.config.welcome.enabled}
                      onCheckedChange={handleToggleWelcome}
                    />
                  </div>

                  <div className="bg-discord-not-quite-black p-4 rounded-md">
                    <h4 className="text-md font-medium mb-2">Current Configuration</h4>
                    <ul className="space-y-2 text-sm text-gray-300">
                      <li className="flex justify-between">
                        <span>Status:</span>
                        <span className={server.config.welcome.enabled ? "text-green-400" : "text-red-400"}>
                          {server.config.welcome.enabled ? "Enabled" : "Disabled"}
                        </span>
                      </li>
                      <li className="flex justify-between">
                        <span>Mode:</span>
                        <span className="text-discord-blurple">{server.config.welcome.mode}</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Channels:</span>
                        <span>{server.config.welcome.channels?.length || 0} configured</span>
                      </li>
                    </ul>
                  </div>

                  <Button
                    onClick={() => router.push(`/servers/${id}/welcome`)}
                    className="w-full bg-discord-green hover:bg-opacity-80 text-white"
                  >
                    Edit Welcome Message
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leave">
            <Card>
              <CardHeader>
                <CardTitle>Leave Message Configuration</CardTitle>
                <CardDescription>Customize the messages shown when members leave your server</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium">Leave Messages</h3>
                      <p className="text-sm text-gray-400">Send customized messages when users leave your server</p>
                    </div>
                    <Switch
                      id="leave-toggle-tab"
                      checked={server.config.leave.enabled}
                      onCheckedChange={handleToggleLeave}
                    />
                  </div>

                  <div className="bg-discord-not-quite-black p-4 rounded-md">
                    <h4 className="text-md font-medium mb-2">Current Configuration</h4>
                    <ul className="space-y-2 text-sm text-gray-300">
                      <li className="flex justify-between">
                        <span>Status:</span>
                        <span className={server.config.leave.enabled ? "text-green-400" : "text-red-400"}>
                          {server.config.leave.enabled ? "Enabled" : "Disabled"}
                        </span>
                      </li>
                      <li className="flex justify-between">
                        <span>Mode:</span>
                        <span className="text-discord-blurple">{server.config.leave.mode}</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Channels:</span>
                        <span>{server.config.leave.channels?.length || 0} configured</span>
                      </li>
                    </ul>
                  </div>

                  <Button
                    onClick={() => router.push(`/servers/${id}/leave`)}
                    className="w-full bg-discord-red hover:bg-opacity-80 text-white"
                  >
                    Edit Leave Message
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Bot Settings</CardTitle>
                <CardDescription>Configure general bot settings for this server</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-discord-dark-but-not-black p-4 rounded-md">
                      <div className="flex items-center mb-4">
                        <Shield className="h-5 w-5 mr-2 text-discord-blurple" />
                        <h3 className="text-lg font-medium">Permissions</h3>
                      </div>
                      <p className="text-sm text-gray-400 mb-4">
                        The bot requires certain permissions to function properly. Make sure it has the following
                        permissions:
                      </p>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          <span>Read Messages</span>
                        </li>
                        <li className="flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          <span>Send Messages</span>
                        </li>
                        <li className="flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          <span>Embed Links</span>
                        </li>
                        <li className="flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          <span>Attach Files</span>
                        </li>
                        <li className="flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          <span>Manage Roles (for auto-role)</span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-discord-dark-but-not-black p-4 rounded-md">
                      <div className="flex items-center mb-4">
                        <Calendar className="h-5 w-5 mr-2 text-discord-yellow" />
                        <h3 className="text-lg font-medium">Events</h3>
                      </div>
                      <p className="text-sm text-gray-400 mb-4">
                        Configure special events and milestones for your server.
                      </p>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Member Milestones</span>
                          <Switch
                            id="milestones-toggle"
                            checked={server.config.events?.milestones?.enabled || false}
                            onCheckedChange={handleToggleMilestones}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Member Anniversaries</span>
                          <Switch
                            id="anniversaries-toggle"
                            checked={server.config.events?.anniversaries?.enabled || false}
                            onCheckedChange={handleToggleAnniversaries}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Card className="bg-discord-dark-but-not-black border-none">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center">
                        <Users className="h-5 w-5 mr-2 text-discord-green" />
                        Auto-Role Configuration
                      </CardTitle>
                      <CardDescription>Automatically assign roles to new members when they join</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Enable Auto-Role</span>
                          <Switch
                            id="auto-role-toggle"
                            checked={server.config.roles?.enabled || false}
                            onCheckedChange={handleToggleAutoRole}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Auto-Assigned Roles</Label>
                          <div className="bg-discord-not-quite-black p-3 rounded-md">
                            {server.config.roles?.autoAssign?.length > 0 ? (
                              <div className="space-y-2">
                                {server.config.roles.autoAssign.map((roleId, index) => (
                                  <div key={roleId} className="flex items-center justify-between">
                                    <span className="text-sm">
                                      {server.roles?.find((r) => r.id === roleId)?.name || `Role ID: ${roleId}`}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 px-2 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                      onClick={() => handleRemoveAutoRole(roleId)}
                                    >
                                      Remove
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-400">No auto-assigned roles configured</p>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            Use the Discord bot command <code>/role configure</code> to manage auto-assigned roles
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label>Self-Assignable Roles</Label>
                          <div className="bg-discord-not-quite-black p-3 rounded-md">
                            {server.config.roles?.selfAssignable?.length > 0 ? (
                              <div className="space-y-2">
                                {server.config.roles.selfAssignable.map((roleId, index) => (
                                  <div key={roleId} className="flex items-center justify-between">
                                    <span className="text-sm">
                                      {server.roles?.find((r) => r.id === roleId)?.name || `Role ID: ${roleId}`}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 px-2 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                      onClick={() => handleRemoveSelfRole(roleId)}
                                    >
                                      Remove
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-400">No self-assignable roles configured</p>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            Members can use <code>/role add</code> and <code>/role remove</code> to manage their roles
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="bg-discord-dark-but-not-black p-4 rounded-md">
                    <div className="flex items-center mb-4">
                      <Settings className="h-5 w-5 mr-2 text-discord-fuchsia" />
                      <h3 className="text-lg font-medium">Advanced Settings</h3>
                    </div>
                    <p className="text-sm text-gray-400 mb-4">
                      These settings are also available through Discord commands.
                    </p>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium">Command Prefix</span>
                          <p className="text-xs text-gray-400">Current: {server.config.prefix || "!"}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            const newPrefix = prompt("Enter new command prefix:", server.config.prefix || "!")
                            if (newPrefix && newPrefix.length <= 3) {
                              try {
                                // Create a copy of the server config
                                const updatedConfig = {
                                  ...server.config,
                                  prefix: newPrefix,
                                }

                                // Send the update to the API
                                const response = await fetch(`/api/servers/${id}/config`, {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({ prefix: newPrefix }),
                                })

                                if (response.ok) {
                                  // Update local state
                                  setServer({
                                    ...server,
                                    config: {
                                      ...server.config,
                                      prefix: newPrefix,
                                    },
                                  })
                                  alert(`Prefix updated to ${newPrefix}`)
                                } else {
                                  const errorData = await response.json()
                                  alert(`Failed to update prefix: ${errorData.error || "Unknown error"}`)
                                }
                              } catch (error) {
                                console.error("Error updating prefix:", error)
                                alert(`Error updating prefix: ${error.message}`)
                              }
                            } else if (newPrefix) {
                              alert("Prefix must be 3 characters or less")
                            }
                          }}
                        >
                          Change
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button className="bg-discord-blurple hover:bg-opacity-80">Save Settings</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  )
}

