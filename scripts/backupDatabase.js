/**
 * Database Backup Script
 * Creates timestamped backups of the JSON database
 * Usage: node scripts/backupDatabase.js
 */

const fs = require("fs").promises;
const path = require("path");

const DB_PATH = path.join(__dirname, "..", "database", "food_ordering.json");
const BACKUP_DIR = path.join(__dirname, "..", "database", "backups");

async function createBackup() {
  try {
    console.log("🔄 Starting database backup...\n");

    // Create backup directory if it doesn't exist
    await fs.mkdir(BACKUP_DIR, { recursive: true });

    // Read current database
    const data = await fs.readFile(DB_PATH, "utf8");

    // Create filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFileName = `food_ordering_${timestamp}.json`;
    const backupPath = path.join(BACKUP_DIR, backupFileName);

    // Write backup file
    await fs.writeFile(backupPath, data);

    // Get file size
    const stats = await fs.stat(backupPath);
    const fileSizeKB = (stats.size / 1024).toFixed(2);

    console.log(`✅ Backup created successfully!`);
    console.log(`📁 Location: ${backupPath}`);
    console.log(`📊 Size: ${fileSizeKB} KB\n`);

    // Clean old backups (keep last 10)
    await cleanOldBackups();

    return backupPath;
  } catch (error) {
    console.error("❌ Backup failed:", error.message);
    throw error;
  }
}

async function cleanOldBackups() {
  try {
    const files = await fs.readdir(BACKUP_DIR);
    const backupFiles = files
      .filter((f) => f.startsWith("food_ordering_") && f.endsWith(".json"))
      .map((f) => ({
        name: f,
        path: path.join(BACKUP_DIR, f),
      }))
      .sort((a, b) => b.name.localeCompare(a.name)); // Sort by date (newest first)

    if (backupFiles.length > 10) {
      console.log(`🧹 Cleaning old backups (keeping last 10)...`);
      const toDelete = backupFiles.slice(10);

      for (const file of toDelete) {
        await fs.unlink(file.path);
        console.log(`   Deleted: ${file.name}`);
      }
      console.log("");
    }
  } catch (error) {
    console.warn("⚠️  Could not clean old backups:", error.message);
  }
}

async function restoreBackup(backupFileName) {
  try {
    console.log(`🔄 Restoring backup: ${backupFileName}\n`);

    const backupPath = path.join(BACKUP_DIR, backupFileName);

    // Check if backup exists
    await fs.access(backupPath);

    // Create a backup of current database before restoring
    await createBackup();

    // Read backup file
    const data = await fs.readFile(backupPath, "utf8");

    // Validate JSON
    JSON.parse(data);

    // Restore backup
    await fs.writeFile(DB_PATH, data);

    console.log("✅ Database restored successfully!\n");
  } catch (error) {
    console.error("❌ Restore failed:", error.message);
    throw error;
  }
}

async function listBackups() {
  try {
    const files = await fs.readdir(BACKUP_DIR);
    const backupFiles = files
      .filter((f) => f.startsWith("food_ordering_") && f.endsWith(".json"))
      .sort((a, b) => b.localeCompare(a));

    if (backupFiles.length === 0) {
      console.log("📭 No backups found.\n");
      return [];
    }

    console.log("📋 Available backups:\n");
    for (const file of backupFiles) {
      const filePath = path.join(BACKUP_DIR, file);
      const stats = await fs.stat(filePath);
      const fileSizeKB = (stats.size / 1024).toFixed(2);
      const date = new Date(stats.mtime).toLocaleString();
      console.log(`   ${file} (${fileSizeKB} KB) - ${date}`);
    }
    console.log("");

    return backupFiles;
  } catch (error) {
    console.error("❌ Failed to list backups:", error.message);
    return [];
  }
}

// Run if called directly
if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case "create":
      createBackup()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;

    case "list":
      listBackups()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;

    case "restore":
      const backupFile = process.argv[3];
      if (!backupFile) {
        console.error("❌ Please specify backup file name");
        console.log(
          "Usage: node scripts/backupDatabase.js restore <filename>\n",
        );
        process.exit(1);
      }
      restoreBackup(backupFile)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;

    default:
      console.log("📦 Database Backup Utility\n");
      console.log("Usage:");
      console.log(
        "  node scripts/backupDatabase.js create          - Create new backup",
      );
      console.log(
        "  node scripts/backupDatabase.js list            - List all backups",
      );
      console.log(
        "  node scripts/backupDatabase.js restore <file>  - Restore from backup\n",
      );
      process.exit(0);
  }
}

module.exports = { createBackup, restoreBackup, listBackups };
