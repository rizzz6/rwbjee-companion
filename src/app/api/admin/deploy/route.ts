import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'

import { headers as getHeaders } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await getHeaders() })

  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { hookUrl } = await req.json()

    if (!hookUrl) {
      return NextResponse.json({ error: 'hookUrl is required' }, { status: 400 })
    }

    let parsedUrl: URL
    try {
      parsedUrl = new URL(hookUrl)
    } catch {
      return NextResponse.json({ error: 'Invalid hookUrl format' }, { status: 400 })
    }

    if (parsedUrl.protocol !== 'https:') {
      return NextResponse.json({ error: 'Only HTTPS hook URLs are permitted' }, { status: 400 })
    }

    const allowedHosts = ['api.vercel.com', 'vercel.com']
    if (!allowedHosts.some(host => parsedUrl.hostname === host || parsedUrl.hostname.endsWith(`.${host}`))) {
      return NextResponse.json({ error: 'Disallowed hookUrl host' }, { status: 400 })
    }

    // Trigger the Vercel Deploy Hook
    const resp = await fetch(parsedUrl.toString(), { method: 'POST' })
    
    if (!resp.ok) {
      const errorText = await resp.text()
      throw new Error(`External hook failed: ${errorText || resp.statusText}`)
    }
    
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[Deploy] Error:`, error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
