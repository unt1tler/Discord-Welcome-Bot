const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

// ANSI color codes for console output
const colors = {
  reset: "\x1b[0m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
  bright: "\x1b[1m",
  blue: "\x1b[34m"
};

async function checkEnvFiles() {
  const rootEnvPath = path.join(__dirname, ".env");
  const rootEnvExamplePath = path.join(__dirname, ".env.example");
  const dashboardEnvPath = path.join(__dirname, "dashboard", ".env");
  const dashboardEnvExamplePath = path.join(__dirname, "dashboard", ".env.example");

  let needsConfig = false;

  if (!fs.existsSync(rootEnvPath) && fs.existsSync(rootEnvExamplePath)) {
    console.log(`${colors.yellow}⚠️ No .env file found in root directory. Creating from example...${colors.reset}`);
    fs.copyFileSync(rootEnvExamplePath, rootEnvPath);
    needsConfig = true;
  }

  if (!fs.existsSync(dashboardEnvPath) && fs.existsSync(dashboardEnvExamplePath)) {
    console.log(`${colors.yellow}⚠️ No .env file found in dashboard directory. Creating from example...${colors.reset}`);
    fs.copyFileSync(dashboardEnvExamplePath, dashboardEnvPath);
    needsConfig = true;
  }

  if (needsConfig) {
    console.log(`${colors.yellow}⚠️ Please configure your .env files before continuing.${colors.reset}`);
    console.log(`${colors.cyan}ℹ️ Set up your Discord bot token, client ID, and other required variables.${colors.reset}`);
    process.exit(0);
  }
}

async function deployCommands() {
  console.log(`${colors.cyan}Deploying slash commands...${colors.reset}`);
  const deploy = spawn("node", ["deploy-commands.js"], { stdio: "inherit", shell: true });
  await new Promise((resolve, reject) => {
    deploy.on("close", (code) => {
      if (code === 0) {
        console.log(`${colors.green}✅ Slash commands deployed successfully!${colors.reset}`);
        resolve();
      } else {
        console.log(`${colors.red}❌ Failed to deploy slash commands (exit code: ${code})${colors.reset}`);
        reject(new Error(`Failed to deploy slash commands (exit code: ${code})`));
      }
    });
  });
}

async function startServices() {
  console.log(`${colors.magenta}${colors.bright}
  ██████╗ ██╗███████╗ ██████╗ ██████╗ ██████╗ ██████╗     ██████╗  ██████╗ ████████╗
  ██╔══██╗██║██╔════╝██╔════╝██╔═══██╗██╔══██╗██╔══██╗    ██╔══██╗██╔═══██╗╚══██╔══╝
  ██║  ██║██║███████╗██║     ██║   ██║██████╔╝██║  ██║    ██████╔╝██║   ██║   ██║   
  ██║  ██║██║╚════██║██║     ██║   ██║██╔══██╗██║  ██║    ██╔══██╗██║   ██║   ██║   
  ██████╔╝██║███████║╚██████╗╚██████╔╝██║  ██║██████╔╝    ██████╔╝╚██████╔╝   ██║   
  ╚═════╝ ╚═╝╚══════╝ ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚═════╝     ╚═════╝  ╚═════╝    ╚═╝   
  ${colors.reset}${colors.cyan}Welcome & Leave Bot with Dashboard${colors.reset}
  ${colors.magenta}Made with <3 by unt1tle${colors.reset}
  `);

  await checkEnvFiles();
  await deployCommands();

  console.log(`${colors.green}Starting services...${colors.reset}`);

  const bot = spawn("node", ["bot.js"], { stdio: "pipe", shell: true });
  const dashboard = spawn("npm", ["run", "dev"], { cwd: path.join(__dirname, "dashboard"), stdio: "pipe", shell: true });

  bot.stdout.on("data", (data) => {
    const output = data.toString().trim();
    if (output) console.log(`${colors.green}[BOT] ${colors.reset}${output}`);
  });
  bot.stderr.on("data", (data) => console.error(`${colors.red}[BOT ERROR] ${colors.reset}${data.toString().trim()}`));
  
  dashboard.stdout.on("data", (data) => {
    const output = data.toString().trim();
    if (output) console.log(`${colors.blue}[DASHBOARD] ${colors.reset}${output}`);
  });
  dashboard.stderr.on("data", (data) => console.error(`${colors.red}[DASHBOARD ERROR] ${colors.reset}${data.toString().trim()}`));

  process.on("SIGINT", () => {
    console.log(`${colors.yellow}Shutting down services...${colors.reset}`);
    bot.kill("SIGINT");
    dashboard.kill("SIGINT");
    process.exit(0);
  });

  console.log(`${colors.green}✅ All services started!${colors.reset}`);
  console.log(`${colors.cyan}ℹ️ Dashboard available at: http://localhost:3000${colors.reset}`);
  console.log(`${colors.cyan}ℹ️ Press Ctrl+C to stop all services${colors.reset}`);
}

startServices().catch((err) => {
  console.error(`${colors.red}Error starting services:${colors.reset}`, err);
  process.exit(1);
});
