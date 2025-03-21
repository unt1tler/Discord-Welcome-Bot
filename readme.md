# Discord Welcome Bot Documentation

## Overview

This Discord bot provides welcome and leave messages, auto-role assignment, and server statistics tracking. The bot includes a web dashboard for easy configuration and monitoring.

### Check out documentation.html for more thorough guidance
https://discord.gg/CR7s2aEf9T

## Features

- **Welcome Messages**: Customizable messages when users join your server
- **Leave Messages**: Customizable messages when users leave your server
- **Auto-Role Assignment**: Automatically assign roles to new members
- **Self-Assignable Roles**: Allow members to assign themselves specific roles
- **Server Statistics**: Track member joins, leaves, and activity over time
- **Custom Prefix**: Set a custom command prefix for your server
- **Event Announcements**: Celebrate member milestones and anniversaries
<details>
  <summary>Dashboard</summary>

  ```
![image](https://github.com/user-attachments/assets/ae396bdc-6b70-4379-a910-f5d36a0a0797)
![image](https://github.com/user-attachments/assets/9d6dd51a-0c30-4bf7-92a4-f135862544c4)
![image](https://github.com/user-attachments/assets/894b24bc-c6e4-4aee-b505-28a279908c65)

  ```
</details>


## Dashboard

The web dashboard allows server administrators to:

1. View server statistics
2. Configure welcome and leave messages
3. Manage auto-role and self-assignable roles
4. Set custom command prefix
5. Enable/disable features

### Server Statistics

The dashboard displays accurate statistics about your server:

- **Today's Activity**: Shows joins and leaves for the current day
- **Weekly Activity**: Shows joins and leaves for the current week
- **Total Activity**: Shows total joins and leaves since the bot joined
- **Activity Graph**: Displays member activity over the past 12 months

The statistics are updated in real-time and reflect actual server activity. When the bot is first added to a server, it will display estimated statistics until it collects enough real data.

### Welcome & Leave Messages

Configure messages that are sent when members join or leave your server:

- **Toggle**: Enable or disable welcome/leave messages
- **Message Type**: Choose between text or embed format
- **Content**: Customize the message content with variables
- **Channels**: Select which channels receive the messages

### Auto-Role Configuration

Set up automatic role assignment for new members:

- **Toggle**: Enable or disable auto-role assignment
- **Role Selection**: Choose which roles are automatically assigned
- **Self-Assignable Roles**: Configure roles that members can assign themselves

### Custom Prefix

Change the command prefix for your server:

1. Go to the Settings tab in the dashboard
2. Find the "Command Prefix" section
3. Click "Change" and enter your new prefix (max 3 characters)
4. The new prefix will be applied immediately

## Bot Commands

### General Commands

- `!help` - Shows help information
- `!ping` - Checks if the bot is online
- `!info` - Shows information about the bot

### Welcome & Leave Commands

- `!welcome config` - Configure welcome messages
- `!leave config` - Configure leave messages

### Role Commands

- `/role add <role>` - Assign yourself a self-assignable role
- `/role remove <role>` - Remove a self-assigned role
- `/role configure` - Configure auto-role settings (admin only)

### Prefix Commands

- `!prefix <new_prefix>` - Change the command prefix (admin only)
- `@BotName prefix <new_prefix>` - Alternative way to change prefix if you forget current one

## Technical Details

### Data Storage

The bot stores configuration and statistics in MongoDB:

- **Guild Configurations**: Prefix, welcome/leave settings, role settings
- **Statistics**: Join/leave counts, member activity history
- **User Data**: Role assignments and preferences

### API Integration

The dashboard communicates with Discord's API and the bot's custom API:

- **Discord API**: Fetches server information, member counts, and roles
- **Bot API**: Retrieves and updates bot configuration and statistics

### Environment Variables

Required environment variables for the bot and dashboard:

# Discord Bot Configuration
# Required settings
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_CLIENT_SECRET=your_client_secret_here
DISCORD_GUILD_ID=your_guild_id_here

# Database settings (MongoDB)
USE_DATABASE=true
MONGODB_URI=mongodb://localhost:27017/discordbot
MONGODB_DB_NAME=discordbot

# Rate limiting with Upstash Redis (optional but recommended)
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token

# Dashboard settings
DASHBOARD_ENABLED=true
DASHBOARD_PORT=3000

# NextAuth settings
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret_string_here
