import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { NextResponse } from 'next/server'
import { headers as getHeaders } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    console.log('--- Initializing Payload for Migration ---')
    const payload = await getPayload({ config: configPromise })
    
    // Auth check
    const { user } = await payload.auth({ headers: await getHeaders() })
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('--- Checking for Tables ---')
    // This will force Payload to ensure tables exist in some environments, 
    // though db:push usually does this. In Next.js dev mode, it usually auto-syncs.
    
    console.log('--- Starting Migration ---')

    // 1. Migrate Tags from 'tags' array to 'tags_rel' relationship
    console.log('Migrating Post Tags...')
    const posts = await payload.find({
      collection: 'posts',
      limit: 1000,
      pagination: false,
      draft: true,
      overrideAccess: true,
    })

    for (const post of posts.docs) {
      // Use cast to any to access hidden legacy field 'tags'
      const legacyTags = (post as unknown as { tags: unknown[] }).tags
      if (Array.isArray(legacyTags) && legacyTags.length > 0 && typeof legacyTags[0] === 'object' && legacyTags[0] !== null && 'label' in legacyTags[0]) {
        console.log(`Normalizing tags for post: ${post.title}`)
        const tagIds: string[] = []
        for (const legacyTag of legacyTags as { label: string }[]) {
          const slug = legacyTag.label.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '')
          
          let tagDoc = await payload.find({
            collection: 'tags',
            where: { slug: { equals: slug } },
          })
          
          if (tagDoc.docs.length === 0) {
            const newTag = await payload.create({
              collection: 'tags',
              data: { name: legacyTag.label, slug },
            })
            tagIds.push(newTag.id as never)
          } else {
            tagIds.push(tagDoc.docs[0].id as never)
          }
        }
        
        await payload.update({
          collection: 'posts',
          id: post.id,
          data: { tags: tagIds } as never,
          overrideAccess: true,
        })
      }
    }

    // 2. Migrate Authors from 'author' group to 'author_rel' relationship
    console.log('Migrating Post Authors...')
    for (const post of posts.docs) {
      const authorName = (post as unknown as { author?: { name: string } }).author?.name
      
      if (authorName && !(post as unknown as { author_rel: unknown }).author_rel) {
        console.log(`Normalizing author for post: ${post.title}`)
        const slug = authorName.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '')

        let authorDoc = await payload.find({
          collection: 'authors',
          where: { slug: { equals: slug } },
        })

        let authorId: number | string | undefined
        if (authorDoc.docs.length === 0) {
          const newAuthor = await payload.create({
            collection: 'authors',
            data: { name: authorName, slug },
          })
          authorId = newAuthor.id
        } else {
          authorId = authorDoc.docs[0].id
        }

        if (authorId) {
          await payload.update({
            collection: 'posts',
            id: post.id,
            data: { author: [authorId] } as never,
            overrideAccess: true,
          })
        }
      }
    }

    // 3. Migrate College Placements
    console.log('Migrating College Placements...')
    const colleges = await payload.find({
      collection: 'colleges',
      limit: 1000,
      pagination: false,
      overrideAccess: true,
    })

    for (const college of colleges.docs) {
      const legacyPlacement = (college as unknown as { placementStats: { highestPackage?: string, averagePackage?: string, nirfMedianSalary?: string, topRecruiters?: unknown, dataSource?: string, sourceReliability?: string } }).placementStats
      if (legacyPlacement && (legacyPlacement.highestPackage || legacyPlacement.averagePackage)) {
        console.log(`Creating placement report for college: ${college.name}`)
        
        const parsePackage = (val: string | undefined) => {
          if (!val) return undefined
          const num = parseFloat(val.replace(/[^\d.]/g, ''))
          return isNaN(num) ? undefined : num
        }

        await payload.create({
          collection: 'college_placement_reports',
          data: {
            college: college.id,
            reportYear: 2023,
            academicYearLabel: 'Legacy Data (Pre-2024)',
            highestPackageLpa: parsePackage(legacyPlacement.highestPackage),
            averagePackageLpa: parsePackage(legacyPlacement.averagePackage),
            medianPackageLpa: parsePackage(legacyPlacement.nirfMedianSalary),
            topRecruiters: legacyPlacement.topRecruiters as never,
            sourceType: 'estimated',
            sourceName: legacyPlacement.dataSource || 'Imported from Legacy System',
            sourceReliability: legacyPlacement.sourceReliability?.toLowerCase() === 'high' ? 'high' : 'medium',
          },
        })
      }
    }

    return NextResponse.json({ success: true, message: 'Migration completed successfully' })
  } catch (error: unknown) {
    console.error('Migration failed:', error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}
