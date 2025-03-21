"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/router"
import { useState, useEffect } from "react"
import Layout from "../../../components/layout"
import { Tabs, TabsList, TabsTrigger } from "../../../components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../../../components/ui/card"
import { Switch } from "../../../components/ui/switch"
import { Label } from "../../../components/ui/label"
import { HexColorPicker } from "react-colorful"
import { Input } from "../../../components/ui/input"
import { Textarea } from "../../../components/ui/textarea"
import { Button } from "../../../components/ui/button"
import { AlertCircle, CheckCircle, ArrowLeft, RefreshCw, Eye, EyeOff, Copy, Check } from "lucide-react"
import { serverAPI } from "../../../lib/api"

export default function WelcomeMessageEditor() {
  const { data: session, status } = useSession({ required: true })
  const router = useRouter()
  const { id } = router.query
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [config, setConfig] = useState(null)
  const [previewUser, setPreviewUser] = useState({
    tag: "NewUser#0001",
    id: "123456789012345678",
    avatar: "/placeholder.svg?height=128&width=128",
  })
  const [copied, setCopied] = useState(false)

  // State for form values
  const [enabled, setEnabled] = useState(true)
  const [mode, setMode] = useState("embed")
  const [embedColor, setEmbedColor] = useState("#57F287")
  const [embedTitle, setEmbedTitle] = useState("Welcome to the Server!")
  const [embedDescription, setEmbedDescription] = useState("Hey {user}, welcome to our awesome community!")
  const [embedFooter, setEmbedFooter] = useState("You are member #{count}")
  const [textMessage, setTextMessage] = useState(
    "🎉 {user} just joined the server! Welcome to our community! You are member #{count}.",
  )
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [embedImage, setEmbedImage] = useState("")
  const [textImage, setTextImage] = useState("")

  useEffect(() => {
    if (id && session) {
      fetchConfig()
    }
  }, [id, session])

  const fetchConfig = async () => {
    try {
      setRefreshing(true)
      // Fetch welcome config from our API
      const data = await serverAPI.getWelcomeConfig(id)
      setConfig(data)
      setEnabled(data.enabled)
      setMode(data.mode || "embed")
      setEmbedColor(data.embed?.color || "#57F287")
      setEmbedTitle(data.embed?.title || "Welcome to the Server!")
      setEmbedDescription(data.embed?.description || "Hey {user}, welcome to our awesome community!")
      setEmbedFooter(data.embed?.footer || "You are member #{count}")
      setEmbedImage(data.embed?.image || "")
      setTextMessage(
        data.text || "🎉 {user} just joined the server! Welcome to our community! You are member #{count}.",
      )
      setTextImage(data.textImage || "")
      setLoading(false)
      setError(null)
    } catch (err) {
      console.error("Error fetching welcome config:", err)
      setError(err.message || "Failed to load welcome configuration")
      setLoading(false)
    } finally {
      setRefreshing(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSaveSuccess(false)

    try {
      // Prepare the config object
      const newConfig = {
        enabled,
        mode,
        embed: {
          color: embedColor,
          title: embedTitle,
          description: embedDescription,
          footer: embedFooter,
          image: embedImage,
        },
        text: textMessage,
        textImage: textImage,
      }

      // Save to API
      await serverAPI.updateWelcomeConfig(id, newConfig)

      // Update local state
      setConfig(newConfig)
      setSaveSuccess(true)

      // Hide success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false)
      }, 3000)
    } catch (err) {
      console.error("Error saving welcome config:", err)
      setError(err.message || "Failed to save welcome configuration")
    } finally {
      setSaving(false)
    }
  }

  // Fix the replaceVariables function to handle null/undefined text
  const formatPreviewText = (text, previewUser, memberCount) => {
    if (!text) return ""
    if (!previewUser) {
      previewUser = {
        tag: "User#0000",
        id: "123456789012345678",
        username: "User",
      }
    }

    // Make sure previewUser.tag exists, otherwise use a fallback
    const userTag = previewUser.tag || previewUser.username || "User#0000"
    const username = userTag.includes("#") ? userTag.split("#")[0] : userTag

    return text
      .replace(/{user}/g, userTag)
      .replace(/{usermention}/g, `@${username}`)
      .replace(/{userid}/g, previewUser.id || "123456789012345678")
      .replace(/{username}/g, username)
      .replace(/{server}/g, "Server Name")
      .replace(/{membercount}/g, memberCount || "100")
  }

  const replaceVariables = (text) => {
    if (!text) return ""

    return text
      .replace(/{user}/g, previewUser.tag)
      .replace(/{usermention}/g, `@${previewUser.tag.split("#")[0]}`)
      .replace(/{userid}/g, previewUser.id)
      .replace(/{username}/g, previewUser.tag.split("#")[0])
      .replace(/{count}/g, "142")
      .replace(/{server}/g, "Server Name")
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (status === "loading" || loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-discord-blurple mb-4"></div>
          <p className="text-gray-400">Loading configuration...</p>
        </div>
      </Layout>
    )
  }

  if (status === "unauthenticated") {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 mb-8">
            <div className="flex items-start">
              <AlertCircle className="h-6 w-6 text-red-500 mr-3 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-red-500">Authentication Required</h3>
                <p className="text-gray-300">You need to be signed in to access this page.</p>
                <div className="mt-4">
                  <Button
                    onClick={() => router.push("/api/auth/signin")}
                    className="bg-discord-blurple hover:bg-opacity-80 text-white"
                  >
                    Sign In
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (error && !config) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 mb-8">
            <div className="flex items-start">
              <AlertCircle className="h-6 w-6 text-red-500 mr-3 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-red-500">Error Loading Configuration</h3>
                <p className="text-gray-300">{error}</p>
                <div className="mt-4 flex space-x-4">
                  <button
                    onClick={fetchConfig}
                    className="bg-discord-blurple hover:bg-opacity-80 text-white px-4 py-2 rounded-md flex items-center"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </button>
                  <button
                    onClick={() => router.push(`/servers/${id}`)}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md flex items-center"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Server
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (error && !config) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 mb-8">
            <div className="flex items-start">
              <AlertCircle className="h-6 w-6 text-red-500 mr-3 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-red-500">Error Loading Configuration</h3>
                <p className="text-gray-300">{error}</p>
                <div className="mt-4 flex space-x-4">
                  <button
                    onClick={fetchConfig}
                    className="bg-discord-blurple hover:bg-opacity-80 text-white px-4 py-2 rounded-md flex items-center"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </button>
                  <button
                    onClick={() => router.push(`/servers/${id}`)}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md flex items-center"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Server
                  </button>
                </div>
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Welcome Message Editor</h1>
            <p className="text-gray-400 mt-1">Customize how new members are greeted when they join your server</p>
          </div>
          <div className="flex space-x-3">
            <Button onClick={fetchConfig} variant="outline" className="flex items-center" disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>
            <Button
              onClick={() => router.push(`/servers/${id}`)}
              className="bg-discord-dark-but-not-black hover:bg-opacity-80 flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Server
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

        {saveSuccess && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <p className="text-green-500">Welcome message settings saved successfully!</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Welcome Message Settings</CardTitle>
                <CardDescription>Configure how new members are greeted when they join your server</CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <Label htmlFor="welcome-enabled">Enable Welcome Messages</Label>
                  <Switch id="welcome-enabled" checked={enabled} onCheckedChange={setEnabled} />
                </div>

                <div className="space-y-2">
                  <Label>Message Type</Label>
                  <Tabs defaultValue={mode} onValueChange={setMode} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="embed">Embed</TabsTrigger>
                      <TabsTrigger value="text">Text</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {mode === "embed" ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="embed-color">Embed Color</Label>
                      <div className="flex items-center">
                        <div
                          className="w-10 h-10 rounded-md mr-3 cursor-pointer"
                          style={{ backgroundColor: embedColor }}
                          onClick={() => setShowColorPicker(!showColorPicker)}
                        ></div>
                        <Input id="embed-color" value={embedColor} onChange={(e) => setEmbedColor(e.target.value)} />
                      </div>
                      {showColorPicker && (
                        <div className="mt-2">
                          <HexColorPicker color={embedColor} onChange={setEmbedColor} />
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="embed-title">Embed Title</Label>
                      <Input id="embed-title" value={embedTitle} onChange={(e) => setEmbedTitle(e.target.value)} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="embed-description">Embed Description</Label>
                      <Textarea
                        id="embed-description"
                        value={embedDescription}
                        onChange={(e) => setEmbedDescription(e.target.value)}
                        rows={3}
                      />
                      <p className="text-xs text-gray-400">
                        Available variables: {"{user}"}, {"{usermention}"}, {"{userid}"}, {"{username}"}, {"{count}"},{" "}
                        {"{server}"}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="embed-image">Embed Image URL</Label>
                      <Input
                        id="embed-image"
                        value={embedImage || ""}
                        onChange={(e) => setEmbedImage(e.target.value)}
                        placeholder="https://example.com/image.png (leave empty for no image)"
                      />
                      <p className="text-xs text-gray-400">
                        Enter a direct URL to an image that will be displayed in the embed
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="embed-footer">Embed Footer</Label>
                      <Input id="embed-footer" value={embedFooter} onChange={(e) => setEmbedFooter(e.target.value)} />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="text-message">Text Message</Label>
                      <Textarea
                        id="text-message"
                        value={textMessage}
                        onChange={(e) => setTextMessage(e.target.value)}
                        rows={4}
                      />
                      <p className="text-xs text-gray-400">
                        Available variables: {"{user}"}, {"{usermention}"}, {"{userid}"}, {"{username}"}, {"{count}"},{" "}
                        {"{server}"}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="text-image">Text Message Image URL</Label>
                      <Input
                        id="text-image"
                        value={textImage || ""}
                        onChange={(e) => setTextImage(e.target.value)}
                        placeholder="https://example.com/image.png (leave empty for no image)"
                      />
                      <p className="text-xs text-gray-400">
                        Enter a direct URL to an image that will be sent with the text message
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button onClick={handleSave} className="w-full bg-discord-green hover:bg-opacity-80" disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>Message Preview</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowPreview(!showPreview)} className="h-8 w-8 p-0">
                  {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </CardHeader>
              <CardContent>
                {showPreview &&
                  (mode === "embed" ? (
                    <div className="border-2 border-gray-700 bg-discord-not-quite-black rounded-md p-4">
                      <div className="border-l-4 pl-3 py-2 rounded-sm" style={{ borderColor: embedColor }}>
                        <p className="font-semibold text-lg mb-2" style={{ color: embedColor }}>
                          {replaceVariables(embedTitle)}
                        </p>
                        <p className="text-gray-300 mb-3">{replaceVariables(embedDescription)}</p>
                        {embedImage && (
                          <div className="mb-3">
                            <img
                              src={embedImage || "/placeholder.svg"}
                              alt="Embed Preview"
                              className="rounded-md max-w-full max-h-[200px] object-cover"
                              onError={(e) => {
                                e.target.src = "/placeholder.svg?height=200&width=400"
                                e.target.alt = "Image failed to load"
                              }}
                            />
                          </div>
                        )}
                        <p className="text-xs text-gray-400">{replaceVariables(embedFooter)}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-gray-700 bg-discord-not-quite-black rounded-md p-4">
                      <p className="text-gray-300 mb-3">{replaceVariables(textMessage)}</p>
                      {textImage && (
                        <div>
                          <img
                            src={textImage || "/placeholder.svg"}
                            alt="Text Message Image"
                            className="rounded-md max-w-full max-h-[200px] object-cover"
                            onError={(e) => {
                              e.target.src = "/placeholder.svg?height=200&width=400"
                              e.target.alt = "Image failed to load"
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
              </CardContent>
              <CardFooter className="flex justify-between">
                <p className="text-sm text-gray-400">
                  This is a simplified preview. The actual message in Discord may look slightly different.
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(
                      mode === "embed" ? replaceVariables(embedDescription) : replaceVariables(textMessage),
                    )
                  }
                  className="h-8 px-2"
                >
                  {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </CardFooter>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Variables Guide</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p>
                    <code className="bg-discord-not-quite-black px-1 py-0.5 rounded">{"{user}"}</code> - User's tag
                    (e.g., NewUser#0001)
                  </p>
                  <p>
                    <code className="bg-discord-not-quite-black px-1 py-0.5 rounded">{"{usermention}"}</code> - Mentions
                    the user (e.g., @NewUser)
                  </p>
                  <p>
                    <code className="bg-discord-not-quite-black px-1 py-0.5 rounded">{"{userid}"}</code> - User's
                    Discord ID
                  </p>
                  <p>
                    <code className="bg-discord-not-quite-black px-1 py-0.5 rounded">{"{username}"}</code> - User's name
                    without discriminator
                  </p>
                  <p>
                    <code className="bg-discord-not-quite-black px-1 py-0.5 rounded">{"{count}"}</code> - Current member
                    count
                  </p>
                  <p>
                    <code className="bg-discord-not-quite-black px-1 py-0.5 rounded">{"{server}"}</code> - Server name
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Channel Configuration</CardTitle>
                <CardDescription>Manage which channels receive welcome messages</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-400 mb-4">
                  You can configure welcome messages to be sent to specific channels. Use the Discord bot commands to
                  add or remove channels.
                </p>
                <div className="bg-discord-not-quite-black p-3 rounded-md text-sm">
                  <p className="font-mono">/welcome channel add #channel [embed|text]</p>
                  <p className="font-mono">/welcome channel remove #channel</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  )
}

