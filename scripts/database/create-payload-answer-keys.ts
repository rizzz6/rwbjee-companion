import dotenv from 'dotenv'
import path from 'path'
import pg from 'pg'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

async function run() {
  const connectionString = process.env.DATABASE_URI
  if (!connectionString) {
    console.error('❌ DATABASE_URI is not set')
    process.exit(1)
  }

  const client = new pg.Client({ connectionString })
  await client.connect()
  console.log('🔌 Connected to PostgreSQL database.')

  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS "payload"."answer_keys" (
      "id" serial PRIMARY KEY,
      "subject" character varying NOT NULL,
      "year" numeric DEFAULT 2026,
      "set_a" text NOT NULL,
      "set_b" text NOT NULL,
      "set_c" text NOT NULL,
      "set_d" text NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now(),
      "created_at" timestamp with time zone DEFAULT now()
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_answer_keys_subject_year 
    ON "payload"."answer_keys" ("subject", "year");

    ALTER TABLE "payload"."payload_locked_documents_rels" 
    ADD COLUMN IF NOT EXISTS "answer_keys_id" integer;

    CREATE INDEX IF NOT EXISTS idx_payload_locked_documents_rels_answer_keys_id 
    ON "payload"."payload_locked_documents_rels" ("answer_keys_id");
  `

  try {
    console.log('🚀 Creating payload.answer_keys table...')
    await client.query(createTableQuery)
    console.log('✅ Table payload.answer_keys created successfully!')
  } catch (err) {
    console.error('❌ Failed to create table:', err)
  } finally {
    await client.end()
    console.log('🔌 Closed database connection.')
  }
}

run().catch(console.error)
