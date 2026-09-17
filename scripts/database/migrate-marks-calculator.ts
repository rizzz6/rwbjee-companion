import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import pg from 'pg'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

async function run() {
  const connectionString = process.env.DATABASE_URI
  if (!connectionString) {
    console.error('❌ DATABASE_URI is not set')
    process.exit(1)
  }

  const sqlPath = path.join(process.cwd(), 'supabase', 'marks-calculator.sql')
  if (!fs.existsSync(sqlPath)) {
    console.error(`❌ SQL file not found at: ${sqlPath}`)
    process.exit(1)
  }

  const sql = fs.readFileSync(sqlPath, 'utf8')
  console.log('📖 Read SQL migration file.')

  const client = new pg.Client({ connectionString })
  await client.connect()
  console.log('🔌 Connected to PostgreSQL database.')

  try {
    console.log('🚀 Executing SQL migration...')
    await client.query(sql)
    console.log('✅ SQL migration completed successfully!')
  } catch (err) {
    console.error('❌ SQL migration failed:', err)
  } finally {
    await client.end()
    console.log('🔌 Closed database connection.')
  }
}

run().catch(console.error)
