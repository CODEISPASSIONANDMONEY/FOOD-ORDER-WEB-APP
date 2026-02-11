const { exec, spawn } = require("child_process");
const os = require("os");

const PORT = process.env.PORT || 3000;

console.log("🔍 Checking if port", PORT, "is already in use...\n");

// Function to kill process on port
function killProcessOnPort(port) {
  return new Promise((resolve) => {
    const isWindows = os.platform() === "win32";

    if (isWindows) {
      // Windows: Find and kill process using port
      exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
        if (error || !stdout) {
          console.log("✅ Port", port, "is free!\n");
          resolve();
          return;
        }

        // Extract PID from netstat output
        const lines = stdout
          .split("\n")
          .filter((line) => line.includes("LISTENING"));
        if (lines.length === 0) {
          console.log("✅ Port", port, "is free!\n");
          resolve();
          return;
        }

        const pid = lines[0].trim().split(/\s+/).pop();
        console.log("⚠️  Found process", pid, "using port", port);
        console.log("🔪 Killing old server process...\n");

        exec(`taskkill /PID ${pid} /F`, (killError) => {
          if (killError) {
            console.log("⚠️  Could not kill process automatically");
            console.log("💡 Please close the other server terminal manually\n");
          } else {
            console.log("✅ Old server stopped!\n");
          }
          setTimeout(resolve, 1000); // Wait 1 second after killing
        });
      });
    } else {
      // Unix/Linux/Mac
      exec(`lsof -ti:${port}`, (error, stdout) => {
        if (error || !stdout) {
          console.log("✅ Port", port, "is free!\n");
          resolve();
          return;
        }

        const pid = stdout.trim();
        console.log("⚠️  Found process", pid, "using port", port);
        console.log("🔪 Killing old server process...\n");

        exec(`kill -9 ${pid}`, (killError) => {
          if (killError) {
            console.log("⚠️  Could not kill process automatically");
            console.log("💡 Please close the other server terminal manually\n");
          } else {
            console.log("✅ Old server stopped!\n");
          }
          setTimeout(resolve, 1000);
        });
      });
    }
  });
}

// Main function
async function startServer() {
  console.log("🚀 Starting Food Ordering System...\n");

  // Kill any existing process on the port
  await killProcessOnPort(PORT);

  // Start the actual server
  console.log("▶️  Launching server...\n");
  const serverProcess = spawn("node", ["server.js"], {
    stdio: "inherit",
    cwd: __dirname.replace("\\scripts", ""),
  });

  serverProcess.on("error", (err) => {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  });

  serverProcess.on("exit", (code) => {
    if (code !== 0) {
      console.error("❌ Server exited with code:", code);
      process.exit(code);
    }
  });
}

// Run
startServer().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
