import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/utils/logger'

// Secret token to prevent unauthorized revalidation requests
const REVALIDATE_TOKEN = process.env.PAYLOAD_REVALIDATE_TOKEN

/**
 * Webhook endpoint for on-demand revalidation
 * This is designed to be triggered by Payload webhooks
 * 
 * Usage: POST /api/revalidate?token=SECRET_TOKEN
 * Body: { collection: string, doc: { slug: string } } (Payload format)
 */
export async function POST(request: NextRequest) {
    const token = request.nextUrl.searchParams.get('token')

    if (!REVALIDATE_TOKEN) {
        logger.error('[Revalidate] REVALIDATE_TOKEN environment variable not set')
        return NextResponse.json({
            success: false,
            error: 'Server configuration error',
        }, { status: 500 })
    }

    if (!token || token !== REVALIDATE_TOKEN) {
        return NextResponse.json({
            success: false,
            error: 'Unauthorized',
        }, { status: 401 })
    }

    try {
        const body = await request.json()
        if (!body || typeof body !== 'object') {
            return NextResponse.json({ success: false, error: 'Invalid body' }, { status: 400 })
        }

        const pathsRevalidated: string[] = []
        
        const type = body.collection
        const slug = body.doc?.slug

        logger.info(`[Revalidate] Processing update on ${type} (slug: ${slug || 'none'})`)

        const safeRevalidate = async (path: string) => {
            try {
                await revalidatePath(path)
                pathsRevalidated.push(path)
            } catch (e) {
                logger.error(`[Revalidate] Failed to revalidate ${path}:`, e)
            }
        }

        // Mapping types to paths
        switch (type) {
            case 'manual':
                if (slug) await safeRevalidate(slug)
                break
            case 'colleges':
                await safeRevalidate('/colleges')
                await safeRevalidate('/')
                await safeRevalidate('/api/predictor/filter')
                await safeRevalidate('/api/predictor/metadata')
                await safeRevalidate('/api/v1/cutoffs/search')
                if (slug) await safeRevalidate(`/colleges/${slug}`)
                break
            case 'college_cutoffs':
            case 'college-cutoffs':
                await safeRevalidate('/cutoffs')
                await safeRevalidate('/')
                await safeRevalidate('/api/predictor/filter')
                await safeRevalidate('/api/predictor/metadata')
                await safeRevalidate('/api/v1/cutoffs/search')
                break
            case 'posts':
                await safeRevalidate('/blog')
                await safeRevalidate('/')
                if (slug) await safeRevalidate(`/blog/${slug}`)
                break
            case 'timeline':
                await safeRevalidate('/timeline')
                await safeRevalidate('/')
                await safeRevalidate('/api/v1/timeline')
                break
            case 'site-settings':
                await safeRevalidate('/')
                await safeRevalidate('/colleges')
                await safeRevalidate('/blog')
                break
            default:
                await safeRevalidate('/')
        }

        return NextResponse.json({
            success: true,
            revalidated: pathsRevalidated.length > 0,
            paths: pathsRevalidated
        })

    } catch (error) {
        logger.error('[Revalidate] Error:', error)
        return NextResponse.json({
            success: false,
            error: 'Internal server error',
        }, { status: 500 })
    }
}

export async function GET() {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
