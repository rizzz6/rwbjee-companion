import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import { headers as getHeaders } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function POST(_req: NextRequest) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await getHeaders() })

  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get all colleges without logos
    const colleges = await payload.find({
      collection: 'colleges',
      where: {
        logo: { exists: false }
      },
      limit: 1000
    })

    // Get all media items
    const mediaItems = await payload.find({
      collection: 'media',
      limit: 1000
    })

    let count = 0
    for (const college of colleges.docs) {
      // Try to find a media item that matches the college name
      const match = mediaItems.docs.find(m => {
        if (!m.filename) return false
        const filename = m.filename.toLowerCase().replace(/\.[^/.]+$/, "") // remove extension
        
        return filename === college.name.toLowerCase() || 
               filename === college.shortName?.toLowerCase() ||
               college.name.toLowerCase().includes(filename) && filename.length > 5
      })

      if (match) {
        await payload.update({
          collection: 'colleges',
          id: college.id,
          data: {
            logo: match.id as number
          }
        })
        count++
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Matched ${count} logos to colleges.`,
      count 
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[MediaMatch] Error:`, error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
