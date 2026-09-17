import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/utils/logger'
import { exec } from 'child_process'
import { promisify } from 'util'

const execPromise = promisify(exec)

import { headers as getHeaders } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await getHeaders() })

  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const script = searchParams.get('script')

  const allowedScripts: Record<string, string> = {
    metadata: 'npx tsx scripts/build/build-metadata.ts',
    cutoffs: 'npx tsx scripts/build/build-cutoffs-data.ts',
    mobile: 'npx tsx scripts/build/generate-static-slices.ts'
  }

  const command = allowedScripts[script as string]

  if (!command) {
    return NextResponse.json({ error: 'Invalid script identifier' }, { status: 400 })
  }

  logger.info(`[Build] Running script: ${command}`)

  try {
    // Execution timeout capped at 60s to prevent hung processes
    const { stdout, stderr } = await execPromise(command, { timeout: 60000, maxBuffer: 10 * 1024 * 1024 })
    
    return NextResponse.json({ 
      success: true, 
      stdout: stdout.substring(0, 1000), // Limit output size
      stderr: stderr.substring(0, 500)
    })
  } catch (error: unknown) {
    const err = error as { message: string, stdout?: string, stderr?: string }
    logger.error(`[Build] Error running ${command}:`, error)
    return NextResponse.json({ 
      error: err.message, 
      stdout: err.stdout?.substring(0, 500),
      stderr: err.stderr?.substring(0, 500)
    }, { status: 500 })
  }
}
