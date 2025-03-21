import fs from 'fs'
import path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function setupDatabase() {
  try {
    // Read the SQL file
    const sqlFile = path.join(process.cwd(), 'lib/db/schema.sql')
    const sqlContent = fs.readFileSync(sqlFile, 'utf8')

    // Split into individual statements
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0)

    // Execute each statement
    for (const statement of statements) {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          query: statement
        })
      })

      if (!response.ok) {
        const error = await response.text()
        console.error('Error executing statement:', error)
        console.error('Statement:', statement)
        throw new Error(error)
      }
    }

    console.log('Database setup completed successfully')
  } catch (error) {
    console.error('Error setting up database:', error)
    process.exit(1)
  }
}

setupDatabase()

