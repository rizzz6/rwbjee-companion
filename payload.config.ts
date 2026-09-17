/* eslint-disable @typescript-eslint/no-explicit-any */
// Fix for Undici / TypeError: Illegal constructor issues on Windows with Node 20+
// This must run before any other imports that might initialize undici
try {
  if (typeof global !== 'undefined') {
    const undici = (function() {
      try {
        // Use eval('require') to bypass Next.js static analysis/bundling
        return eval('require')('undici')
      } catch {
        return null
      }
    })()

    if (undici && (typeof (global as any).Request === 'undefined' || (global as any).Request.name !== 'Request')) {
      ;(global as any).Request = undici.Request
      ;(global as any).Response = undici.Response
      ;(global as any).Headers = undici.Headers
      ;(global as any).fetch = undici.fetch
    }

    // Shim caches to bypass problematic creation of a real CacheStorage on some environments
    if (typeof (global as any).caches === 'undefined') {
      ;(global as any).caches = {
        open: () => Promise.resolve({}),
        keys: () => Promise.resolve([]),
        has: () => Promise.resolve(false),
        delete: () => Promise.resolve(false),
        match: () => Promise.resolve(undefined),
      }
    }
  }
} catch {
  // Ignore errors if undici is not available
}

import { buildConfig } from 'payload'
import { s3Storage } from '@payloadcms/storage-s3'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'

import { Colleges } from './src/collections/Colleges'
import { Media } from './src/collections/Media'
import { CollegeCutoffs } from './src/collections/CollegeCutoffs'
import { Posts } from './src/collections/Posts'
import { Timeline } from './src/collections/Timeline'
import { SiteSettings } from './src/collections/SiteSettings'
import { Users } from './src/collections/Users'
import { Tags } from './src/collections/Tags'
import { Authors } from './src/collections/Authors'
import { CollegePlacementReports } from './src/collections/CollegePlacementReports'
import { AnswerKeys } from './src/collections/AnswerKeys'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

function requireEnv(name: string): string {
  const value = process.env[name]?.trim()

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: '- rwbjee',
      icons: [{
        url: '/assets/logo.svg',
      }],
      openGraph: {
        images: [{
          url: '/assets/images/og-image.svg',
        }],
      },
    },
    components: {
      Nav: './src/components/admin/Nav#default',
      graphics: {
        Logo: './src/components/admin/Logo#Logo',
        Icon: './src/components/admin/Icon#Icon',
      },
      afterDashboard: ['./src/components/admin/DashboardAnalytics#default'],
      views: {
        Analytics: {
          Component: './src/components/admin/views/Analytics/index#default',
          path: '/analytics',
        },
        Quality: {
          Component: './src/components/admin/views/QualityAudit/index#default',
          path: '/quality',
        },
        DataManagement: {
          Component: './src/components/admin/views/DataManagement/index#default',
          path: '/data-management',
        },
        Operations: {
          Component: './src/components/admin/views/Operations/index#default',
          path: '/operations',
        },
        account: {
          Component: './src/components/admin/views/Account/index#default',
        },
      },
    },
  },
  editor: lexicalEditor({}),
  collections: [Colleges, CollegeCutoffs, Media, Posts, Timeline, Users, Tags, Authors, CollegePlacementReports, AnswerKeys],
  globals: [SiteSettings],
  secret: requireEnv('PAYLOAD_SECRET'),
  db: postgresAdapter({
    pool: {
      connectionString: requireEnv('DATABASE_URI'),
      max: process.env.NODE_ENV === 'production' ? 3 : 10, // 3 connections per worker = ~9-12 total
    },
    schemaName: 'payload',
    push: false,
  }),
  plugins: [
    s3Storage({
      collections: {
        media: true,
      },
      bucket: process.env.S3_BUCKET || '',
      config: {
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        },
        region: process.env.S3_REGION || 'ap-south-1',
        endpoint: process.env.S3_ENDPOINT || '',
        forcePathStyle: true,
      },
    }),
  ],
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
