const fs = require("fs");
const path = require("path");

const migrationsBackupDir = path.join(
  __dirname,
  "../src/database/migrations_backup"
);
const activeMigrationsDir = path.join(__dirname, "../src/database/migrations");

console.log("🧹 Starting migration cleanup...");

// Get list of active migration files
const activeMigrations = fs
  .readdirSync(activeMigrationsDir)
  .filter((file) => file.endsWith(".ts"))
  .map((file) => file.replace(".ts", ""));

console.log(`📋 Active migrations: ${activeMigrations.length}`);
activeMigrations.forEach((migration) => console.log(`  - ${migration}`));

// Get list of backup migration files
const backupMigrations = fs
  .readdirSync(migrationsBackupDir)
  .filter((file) => file.endsWith(".ts"))
  .map((file) => file.replace(".ts", ""));

console.log(`📋 Backup migrations: ${backupMigrations.length}`);

// Find migrations that are no longer needed
const unusedMigrations = backupMigrations.filter((backup) => {
  // Check if this backup migration is still referenced in active migrations
  return !activeMigrations.some((active) => {
    // Check if the backup migration is a dependency of any active migration
    const backupContent = fs.readFileSync(
      path.join(migrationsBackupDir, `${backup}.ts`),
      "utf8"
    );

    // Simple check: if backup migration creates tables that are still used
    const createsTables = backupContent.includes("CREATE TABLE");
    const createsIndexes = backupContent.includes("CREATE INDEX");

    if (createsTables || createsIndexes) {
      // Check if any active migration references these tables
      return activeMigrations.some((activeMigration) => {
        const activeContent = fs.readFileSync(
          path.join(activeMigrationsDir, `${activeMigration}.ts`),
          "utf8"
        );
        return (
          activeContent.includes("ALTER TABLE") ||
          activeContent.includes("DROP TABLE")
        );
      });
    }

    return false;
  });
});

console.log(`🗑️ Unused migrations to remove: ${unusedMigrations.length}`);

if (unusedMigrations.length > 0) {
  console.log("\n📝 Unused migrations:");
  unusedMigrations.forEach((migration) => {
    console.log(`  - ${migration}`);
  });

  // Ask for confirmation
  console.log("\n⚠️ This will permanently delete these migration files.");
  console.log(
    "💡 Consider backing them up first if you need them for reference."
  );

  // In a real scenario, you might want to add a confirmation prompt here
  // For now, we'll just log what would be deleted
  console.log("\n✅ Migration cleanup analysis complete.");
  console.log(
    "📝 To actually delete these files, uncomment the deletion code in this script."
  );

  // Uncomment the following lines to actually delete the files:
  /*
  unusedMigrations.forEach(migration => {
    const filePath = path.join(migrationsBackupDir, `${migration}.ts`);
    fs.unlinkSync(filePath);
    console.log(`🗑️ Deleted: ${migration}.ts`);
  });
  */
} else {
  console.log("✅ No unused migrations found.");
}

console.log("\n🎉 Migration cleanup analysis complete!");
