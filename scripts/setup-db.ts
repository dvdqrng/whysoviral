import { sql } from "@vercel/postgres"
import fs from "fs"
import path from "path"

async function setupDatabase() {
  try {
    // Read the SQL file
    const sqlFile = path.join(process.cwd(), "schema.sql")
    const sqlContent = fs.readFileSync(sqlFile, "utf8")

    // Execute the SQL
    await sql.query(sqlContent)

    console.log("Database setup completed successfully")
  } catch (error) {
    console.error("Error setting up database:", error)
  }
}

setupDatabase()

