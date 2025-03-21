import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Code } from "lucide-react"

export default function DiscordBot() {
  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Discord Welcome & Leave Bot</h1>

      <Tabs defaultValue="preview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="setup">Setup Guide</TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Welcome Message Preview */}
            <Card className="border-2 border-green-500/20 bg-black/90 text-white shadow-lg">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                    Welcome Message
                  </Badge>
                  <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
                    Embed Mode
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4 border-l-4 border-green-500 pl-3 py-2">
                  <div className="flex-shrink-0">
                    <Avatar className="h-10 w-10 border-2 border-green-500/50">
                      <AvatarImage src="/placeholder.svg?height=40&width=40" />
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-lg text-green-400">Welcome to the Server!</CardTitle>
                    <CardDescription className="text-gray-300">
                      Hey <span className="text-green-400 font-semibold">@NewUser</span>, welcome to our awesome
                      community! We're thrilled to have you here.
                    </CardDescription>
                    <div className="pt-2">
                      <img
                        src="/placeholder.svg?height=180&width=450"
                        alt="Welcome Banner"
                        className="rounded-md w-full h-[180px] object-cover border border-green-500/20"
                      />
                    </div>
                    <div className="flex items-center pt-2 text-xs text-gray-400">
                      <div className="flex-1">You are member #142</div>
                      <div>Today at 4:20 PM</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Leave Message Preview */}
            <Card className="border-2 border-red-500/20 bg-black/90 text-white shadow-lg">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30">
                    Leave Message
                  </Badge>
                  <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
                    Embed Mode
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4 border-l-4 border-red-500 pl-3 py-2">
                  <div className="flex-shrink-0">
                    <Avatar className="h-10 w-10 border-2 border-red-500/50">
                      <AvatarImage src="/placeholder.svg?height=40&width=40" />
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-lg text-red-400">User Left the Server</CardTitle>
                    <CardDescription className="text-gray-300">
                      <span className="text-red-400 font-semibold">@SomeUser</span> has left our community. We hope to
                      see them again soon!
                    </CardDescription>
                    <div className="pt-2">
                      <img
                        src="/placeholder.svg?height=180&width=450"
                        alt="Leave Banner"
                        className="rounded-md w-full h-[180px] object-cover border border-red-500/20"
                      />
                    </div>
                    <div className="flex items-center pt-2 text-xs text-gray-400">
                      <div className="flex-1">They were with us for 42 days</div>
                      <div>Today at 5:30 PM</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Text Mode Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-2 border-blue-500/20 bg-black/90 text-white shadow-lg">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                    Welcome Message
                  </Badge>
                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                    Text Mode
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="py-2 px-3 bg-gray-900/60 rounded-md border border-blue-500/20">
                  <p className="text-gray-300">
                    🎉 <span className="text-blue-400 font-semibold">@NewUser</span> just joined the server! Welcome to
                    our community! You are member #142. Make sure to check out our rules and introduction channels.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-orange-500/20 bg-black/90 text-white shadow-lg">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/30">
                    Leave Message
                  </Badge>
                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                    Text Mode
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="py-2 px-3 bg-gray-900/60 rounded-md border border-orange-500/20">
                  <p className="text-gray-300">
                    👋 <span className="text-orange-400 font-semibold">@SomeUser</span> has left the server. They were
                    with us for 42 days. We hope to see them again!
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Configuration File
              </CardTitle>
              <CardDescription>All bot settings can be customized in the config.js file</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-black/90 text-gray-300 p-4 rounded-md overflow-auto text-sm">
                {`// config.js
module.exports = {
  // Bot Configuration
  token: "YOUR_BOT_TOKEN",
  clientId: "YOUR_CLIENT_ID",
  guildId: "YOUR_GUILD_ID", // For slash command registration
  
  // Command Settings
  prefix: "!",  // Prefix for text commands
  enablePrefix: true, // Set to false to disable prefix commands
  
  // Welcome Message Settings
  welcome: {
    enabled: true,
    channelId: "WELCOME_CHANNEL_ID",
    mode: "embed", // "embed" or "text"
    
    // Embed Mode Settings (ignored if mode is "text")
    embed: {
      color: "#43B581", // Green color
      title: "Welcome to the Server!",
      description: "Hey {user}, welcome to our awesome community! We're thrilled to have you here.",
      showTimestamp: true,
      showMemberCount: true,
      image: "https://your-welcome-image.png", // Full URL to image
      thumbnail: "user", // "user" to use user's avatar or URL to custom image
      footer: {
        text: "You are member #{count}",
        icon: "" // URL to footer icon (optional)
      }
    },
    
    // Text Mode Settings (ignored if mode is "embed")
    text: "🎉 {user} just joined the server! Welcome to our community! You are member #{count}. Make sure to check out our rules and introduction channels."
  },
  
  // Leave Message Settings
  leave: {
    enabled: true,
    channelId: "LEAVE_CHANNEL_ID",
    mode: "embed", // "embed" or "text"
    
    // Embed Mode Settings (ignored if mode is "text")
    embed: {
      color: "#F04747", // Red color
      title: "User Left the Server",
      description: "{user} has left our community. We hope to see them again soon!",
      showTimestamp: true,
      showJoinDuration: true,
      image: "https://your-leave-image.png", // Full URL to image
      thumbnail: "user", // "user" to use user's avatar or URL to custom image
      footer: {
        text: "They were with us for {duration}",
        icon: "" // URL to footer icon (optional)
      }
    },
    
    // Text Mode Settings (ignored if mode is "embed")
    text: "👋 {user} has left the server. They were with us for {duration}. We hope to see them again!"
  }
};`}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="setup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Setup Guide</CardTitle>
              <CardDescription>Follow these steps to get your bot up and running</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">1. Prerequisites</h3>
                <ul className="list-disc pl-5 text-sm text-muted-foreground">
                  <li>Node.js 16.9.0 or higher</li>
                  <li>Discord.js v14</li>
                  <li>A Discord bot token (from Discord Developer Portal)</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">2. Installation</h3>
                <pre className="bg-black/90 text-gray-300 p-3 rounded-md overflow-auto text-sm">
                  {`# Clone the repository
git clone https://github.com/yourusername/discord-welcome-bot.git

# Navigate to the project directory
cd discord-welcome-bot

# Install dependencies
npm install`}
                </pre>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">3. Configuration</h3>
                <p className="text-sm text-muted-foreground">
                  Edit the <code>config.js</code> file with your bot token, channel IDs, and customize the welcome/leave
                  messages.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">4. Start the Bot</h3>
                <pre className="bg-black/90 text-gray-300 p-3 rounded-md overflow-auto text-sm">
                  {`# Start the bot
npm start`}
                </pre>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">5. Commands</h3>
                <div className="bg-black/90 text-gray-300 p-3 rounded-md overflow-auto text-sm">
                  <p>
                    <code>/welcome test</code> - Test the welcome message
                  </p>
                  <p>
                    <code>/leave test</code> - Test the leave message
                  </p>
                  <p>
                    <code>/config reload</code> - Reload the configuration file
                  </p>
                  <p>
                    <code>!welcome test</code> - Test welcome message (prefix command)
                  </p>
                  <p>
                    <code>!leave test</code> - Test leave message (prefix command)
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">Download Source Code</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

