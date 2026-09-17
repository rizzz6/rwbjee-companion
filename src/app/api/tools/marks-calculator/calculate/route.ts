import { NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload-client'
import { calculateSubjectScore, SubjectResult } from '@/utils/marks/scoring'
import { fallbackAnswerKeys } from '@/utils/marks/fallback-keys'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { examType, mathSet, phyChemSet, mathResponses, phyChemResponses } = body

    if (!examType || !['both', 'physics_chemistry'].includes(examType)) {
      return NextResponse.json({ error: 'Invalid exam type' }, { status: 400 })
    }

    const payload = await getPayloadClient()
    const results: Record<string, SubjectResult> = {}

    // 1. Process Physics/Chemistry
    if (phyChemSet) {
      if (!['A', 'B', 'C', 'D'].includes(phyChemSet)) {
        return NextResponse.json({ error: 'Invalid Physics/Chemistry set' }, { status: 400 })
      }
      if (!phyChemResponses || !Array.isArray(phyChemResponses)) {
        return NextResponse.json({ error: 'Missing Physics/Chemistry responses' }, { status: 400 })
      }

      let phyChemKey: (string | string[])[] | null = null
      try {
        const query = await payload.find({
          collection: 'answer-keys',
          where: {
            subject: { equals: 'Physics/Chemistry' },
            year: { equals: 2026 },
          },
          limit: 1,
        })
        if (query.docs && query.docs.length > 0) {
          const doc = query.docs[0]
          const fieldKey = `set${phyChemSet}` as 'setA' | 'setB' | 'setC' | 'setD'
          const rawKey = doc[fieldKey]
          if (rawKey) {
            phyChemKey = typeof rawKey === 'string' ? JSON.parse(rawKey) : rawKey
          }
        }
      } catch (err) {
        console.error('Failed to fetch Physics/Chemistry key from Payload CMS, using fallback:', err)
      }

      if (!phyChemKey) {
        phyChemKey = fallbackAnswerKeys['Physics/Chemistry']?.[phyChemSet]
      }

      if (!phyChemKey) {
        return NextResponse.json({ error: 'Physics/Chemistry answer key not found' }, { status: 500 })
      }

      results['Physics/Chemistry'] = calculateSubjectScore('Physics/Chemistry', phyChemResponses, phyChemKey)
    }

    // 2. Process Mathematics (if 'both' is chosen)
    if (examType === 'both' && mathSet) {
      if (!['A', 'B', 'C', 'D'].includes(mathSet)) {
        return NextResponse.json({ error: 'Invalid Mathematics set' }, { status: 400 })
      }
      if (!mathResponses || !Array.isArray(mathResponses)) {
        return NextResponse.json({ error: 'Missing Mathematics responses' }, { status: 400 })
      }

      let mathKey: (string | string[])[] | null = null
      try {
        const query = await payload.find({
          collection: 'answer-keys',
          where: {
            subject: { equals: 'Mathematics' },
            year: { equals: 2026 },
          },
          limit: 1,
        })
        if (query.docs && query.docs.length > 0) {
          const doc = query.docs[0]
          const fieldKey = `set${mathSet}` as 'setA' | 'setB' | 'setC' | 'setD'
          const rawKey = doc[fieldKey]
          if (rawKey) {
            mathKey = typeof rawKey === 'string' ? JSON.parse(rawKey) : rawKey
          }
        }
      } catch (err) {
        console.error('Failed to fetch Mathematics key from Payload CMS, using fallback:', err)
      }

      if (!mathKey) {
        mathKey = fallbackAnswerKeys['Mathematics']?.[mathSet]
      }

      if (!mathKey) {
        return NextResponse.json({ error: 'Mathematics answer key not found' }, { status: 500 })
      }

      results['Mathematics'] = calculateSubjectScore('Mathematics', mathResponses, mathKey)
    }

    // 3. Compute totals
    const mathScore = results['Mathematics']?.totalMarks || 0
    const phyChemScore = results['Physics/Chemistry']?.totalMarks || 0
    const totalScore = Number((mathScore + phyChemScore).toFixed(2))

    return NextResponse.json({
      totalScore,
      examType,
      mathSet,
      phyChemSet,
      ...results,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Error in calculation API:', err)
    return NextResponse.json({ error: 'Internal server error: ' + message }, { status: 500 })
  }
}
