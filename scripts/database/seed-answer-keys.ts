/**
 * Seed Answer Keys in Payload CMS from fallback keys
 *
 * Usage: npx dotenv-cli -e .env.local -- tsx scripts/database/seed-answer-keys.ts
 */

import dotenv from 'dotenv'
import path from 'path'
import { getPayload } from 'payload'
import { fallbackAnswerKeys } from '../../src/utils/marks/fallback-keys'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

async function seedAnswerKeys() {
  console.log('🌱 Starting Answer Keys Seed...\n')

  const { default: config } = await import('../../payload.config')
  const payload = await getPayload({ config })

  const subjects = ['Mathematics', 'Physics/Chemistry'] as const

  for (const subject of subjects) {
    const existing = await payload.find({
      collection: 'answer-keys',
      where: {
        subject: { equals: subject },
        year: { equals: 2026 },
      },
      limit: 1,
    })

    const data = {
      subject,
      year: 2026,
      setA: JSON.stringify(fallbackAnswerKeys[subject].A),
      setB: JSON.stringify(fallbackAnswerKeys[subject].B),
      setC: JSON.stringify(fallbackAnswerKeys[subject].C),
      setD: JSON.stringify(fallbackAnswerKeys[subject].D),
    }

    if (existing.docs.length > 0) {
      const existingId = existing.docs[0].id
      await payload.update({
        collection: 'answer-keys',
        id: existingId,
        data,
      })
      console.log(`✅ Updated Answer Key for: ${subject} (2026)`)
    } else {
      await payload.create({
        collection: 'answer-keys',
        data,
      })
      console.log(`✅ Created Answer Key for: ${subject} (2026)`)
    }
  }

  console.log('\n🎉 Answer Keys seeding complete!')
  process.exit(0)
}

seedAnswerKeys().catch(console.error)
