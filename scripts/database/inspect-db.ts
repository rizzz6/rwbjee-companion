import dotenv from 'dotenv'
import path from 'path'
import pg from 'pg'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

async function inspect() {
  const connectionString = process.env.DATABASE_URI
  if (!connectionString) {
    console.error('DATABASE_URI is not set')
    process.exit(1)
  }

  const client = new pg.Client({ connectionString })
  await client.connect()

  try {
    // 1. List all tables in the payload schema
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'payload'
    `)
    console.log('Tables in payload schema:')
    tablesRes.rows.forEach(r => console.log(` - ${r.table_name}`))

    // 2. Inspect columns of colleges to see naming convention
    const colsRes = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'colleges' AND table_schema = 'payload'
    `)
    console.log('\nColumns in colleges table:')
    colsRes.rows.forEach(r => console.log(` - ${r.column_name}: ${r.data_type}`))

  } catch (err) {
    console.error(err)
  } finally {
    await client.end()
  }
}

inspect().catch(console.error)
