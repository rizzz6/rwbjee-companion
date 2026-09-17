import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'

export const GET = async (req: Request) => {
  const { searchParams } = new URL(req.url)
  const url = searchParams.get('url')
  const token = searchParams.get('token')

  if (!url || !token) {
    return new Response('Missing URL or Token', { status: 400 })
  }

  // Prevent open redirect: URL must be a relative internal path
  if (!url.startsWith('/') || url.startsWith('//')) {
    return new Response('Invalid preview URL: must be relative path', { status: 400 })
  }

  const payload = await getPayload({ config })

  // Verify the token with Payload
  // Note: Payload v3 verifyToken check
  try {
    const { user } = await payload.auth({
      headers: new Headers({
        Authorization: `JWT ${token}`,
      }),
    })

    if (!user) {
      return new Response('Invalid Token', { status: 403 })
    }

    // Enable Draft Mode in Next.js
    const draft = await draftMode()
    draft.enable()
  } catch (error) {
    console.error('Preview error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }

  // Redirect to the actual page (must be outside try-catch because redirect throws an error)
  redirect(url)
}

