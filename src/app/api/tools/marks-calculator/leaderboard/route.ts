import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { getPayloadClient } from '@/lib/payload-client'
import { calculateSubjectScore, SubjectResult } from '@/utils/marks/scoring'
import { fallbackAnswerKeys } from '@/utils/marks/fallback-keys'
import { getServerSupabase } from '@/utils/database/supabase'

// GET: Fetch the top 100 leaderboard entries with optional exam_type filter
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const examType = searchParams.get('exam_type')

    const supabase = getServerSupabase()
    
    // Select public-safe fields, ordered by score descending and earlier submission first
    let query = supabase
      .from('marks_submissions')
      .select('nickname, exam_type, math_set, phy_chem_set, math_score, phy_chem_score, total_score, created_at')

    if (examType && ['both', 'physics_chemistry'].includes(examType)) {
      query = query.eq('exam_type', examType)
    }

    const { data, error } = await query
      .order('total_score', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(100)

    if (error) {
      console.error('Error fetching leaderboard from Supabase:', error)
      return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
    }

    return NextResponse.json({ leaderboard: data || [] })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Error in leaderboard GET:', err)
    return NextResponse.json({ error: 'Internal server error: ' + message }, { status: 500 })
  }
}

// POST: Securely submit score (recalculates on server and upserts)
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { nickname, applicationNumber, examType, mathSet, phyChemSet, mathResponses, phyChemResponses } = body

    // 1. Validation
    if (!nickname || typeof nickname !== 'string' || nickname.trim().length < 2 || nickname.trim().length > 30) {
      return NextResponse.json({ error: 'Nickname must be between 2 and 30 characters' }, { status: 400 })
    }
    if (!applicationNumber || typeof applicationNumber !== 'string' || applicationNumber.trim().length === 0) {
      return NextResponse.json({ error: 'Application number is required' }, { status: 400 })
    }
    if (!examType || !['both', 'physics_chemistry'].includes(examType)) {
      return NextResponse.json({ error: 'Invalid exam type' }, { status: 400 })
    }

    // 2. Hash application number for privacy & unique check in Database
    const hashedAppNumber = crypto
      .createHash('sha256')
      .update(applicationNumber.trim().toUpperCase())
      .digest('hex')

    const payload = await getPayloadClient()
    const results: Record<string, SubjectResult> = {}

    // 3. Grade Physics/Chemistry responses on server
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
        console.error('Failed to fetch Physics/Chemistry key from Payload CMS during submission, using fallback:', err)
      }

      if (!phyChemKey) {
        phyChemKey = fallbackAnswerKeys['Physics/Chemistry']?.[phyChemSet]
      }

      if (!phyChemKey) {
        return NextResponse.json({ error: 'Physics/Chemistry answer key not found' }, { status: 500 })
      }

      results['Physics/Chemistry'] = calculateSubjectScore('Physics/Chemistry', phyChemResponses, phyChemKey)
    }

    // 4. Grade Mathematics responses on server
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
        console.error('Failed to fetch Mathematics key from Payload CMS during submission, using fallback:', err)
      }

      if (!mathKey) {
        mathKey = fallbackAnswerKeys['Mathematics']?.[mathSet]
      }

      if (!mathKey) {
        return NextResponse.json({ error: 'Mathematics answer key not found' }, { status: 500 })
      }

      results['Mathematics'] = calculateSubjectScore('Mathematics', mathResponses, mathKey)
    }

    const mathScore = results['Mathematics']?.totalMarks || 0
    const phyChemScore = results['Physics/Chemistry']?.totalMarks || 0
    const totalScore = Number((mathScore + phyChemScore).toFixed(2))

    // 5. Connect to Supabase and upsert score
    const supabase = getServerSupabase()

    // Check if entry already exists to preserve created_at for tie-break
    const { data: existingEntry } = await supabase
      .from('marks_submissions')
      .select('created_at')
      .eq('application_number', hashedAppNumber)
      .maybeSingle()

    const now = new Date().toISOString()
    const submissionRow = {
      nickname: nickname.trim(),
      application_number: hashedAppNumber,
      exam_type: examType,
      math_set: examType === 'both' ? mathSet : null,
      phy_chem_set: phyChemSet || null,
      math_score: examType === 'both' ? mathScore : null,
      phy_chem_score: phyChemScore || null,
      total_score: totalScore,
      math_responses: examType === 'both' ? mathResponses : null,
      phy_chem_responses: phyChemResponses || null,
      created_at: existingEntry?.created_at || now,
      updated_at: now,
    }

    const { data, error } = await supabase
      .from('marks_submissions')
      .upsert(submissionRow, { onConflict: 'application_number' })
      .select()

    if (error) {
      console.error('Error upserting score to Supabase:', error)
      return NextResponse.json({ error: 'Failed to record leaderboard entry: ' + error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Score successfully recorded!',
      totalScore,
      mathScore: examType === 'both' ? mathScore : null,
      phyChemScore: phyChemScore || null,
      entry: data?.[0]
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Error in leaderboard POST:', err)
    return NextResponse.json({ error: 'Internal server error: ' + message }, { status: 500 })
  }
}
