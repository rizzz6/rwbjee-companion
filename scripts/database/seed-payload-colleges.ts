/**
 * Seed Payload Colleges from individual-college-details.json
 *
 * Usage: npx dotenv-cli -e .env.local -- tsx scripts/database/seed-payload-colleges.ts
 */

import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import { getPayload } from 'payload'

import {
  convertParagraphsToRichText,
  getPayloadEditorConfig,
  normalizeHighlightItems,
} from '../../src/utils/payload-richtext'
import { parseIndianMoneyBound } from '../../src/utils/money-parser'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

interface JsonCollege {
  college_name: string
  website?: string
  location?: string
  type?: string
  highlights?: string[]
  placement_stats?: {
    highest_package?: string | null
    average_package?: string | null
    nirf_median_salary?: string | null
    top_recruiters?: string[]
    source_reliability?: string
    data_source?: string
  }
  fees_stats?: {
    total_course_fee?: string | null
    fee_per_semester?: string | null
  }
  seo_desc?: string
  about?: {
    para1?: string
    para2?: string
  }
}

async function seedColleges() {
  console.log('Starting Payload College Seed...\n')

  const { default: config } = await import('../../payload.config')
  const payload = await getPayload({ config })
  const editorConfig = getPayloadEditorConfig(payload.config.editor)

  const jsonPath = path.join(process.cwd(), 'public/data/individual-college-details.json')
  const jsonData: JsonCollege[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
  console.log(`Loaded ${jsonData.length} college records from JSON.\n`)

  let created = 0
  let skipped = 0
  let errors = 0

  for (const item of jsonData) {
    const jsonName = item.college_name
    const officialName = jsonName
    const slug = slugify(jsonName)

    const existing = await payload.find({
      collection: 'colleges',
      where: { slug: { equals: slug } },
      limit: 1,
    })

    const existingDoc = existing.docs.length > 0 ? (existing.docs[0] as unknown as { id: string | number; isVisible: boolean; priority: number }) : null
    const existingId = existingDoc ? existingDoc.id : null


    let collegeType: string | undefined = item.type
    if (collegeType === 'Govt') collegeType = 'Government'
    else if (collegeType === 'Pvt') collegeType = 'Private'

    const highlights = item.highlights || []
    const estdHighlight = highlights.find((highlight) => highlight.toLowerCase().includes('estd'))
    const estYearMatch = estdHighlight?.match(/\d{4}/)
    const estYear = estYearMatch ? parseInt(estYearMatch[0]) : undefined
    const filteredHighlights = highlights.filter((highlight) => !highlight.toLowerCase().includes('estd'))
    const overview = convertParagraphsToRichText({
      editorConfig,
      paragraphs: [item.about?.para1 || '', item.about?.para2 || ''].filter(Boolean),
    })

    try {
      const data = {
        name: jsonName,
        slug,
        location: item.location || '',
        type: collegeType as 'Government' | 'Private' | 'Institutional' | 'University' | 'Semi-Govt',
        website: item.website || '',
        isVisible: existingDoc ? existingDoc.isVisible : false,
        estYear,
        priority: existingDoc ? existingDoc.priority : 3,
        seoDescription: item.seo_desc || '',
        cutoffSourceName: officialName,
        highlights: normalizeHighlightItems(filteredHighlights),
        overview,
        about: {
          para1: item.about?.para1 || '',
          para2: item.about?.para2 || '',
        },
        placementStats: {
          highestPackage: item.placement_stats?.highest_package || '',
          averagePackage: item.placement_stats?.average_package || '',
          nirfMedianSalary: item.placement_stats?.nirf_median_salary || '',
          sourceReliability: (item.placement_stats?.source_reliability as 'High' | 'Medium' | 'Low' | 'Official') || undefined,
          dataSource: item.placement_stats?.data_source || '',
        },
        feesStats: {
          totalCourseFeeAmount: parseIndianMoneyBound(item.fees_stats?.total_course_fee),
          semesterFeeAmount: parseIndianMoneyBound(item.fees_stats?.fee_per_semester),
          currencyCode: 'INR' as const,
        },
      }

      if (existingId) {
        await payload.update({
          collection: 'colleges',
          id: existingId,
          data: data as never,
        })
        console.log(`Updated: ${jsonName}`)
      } else {
        await payload.create({
          collection: 'colleges',
          data: data as never,
        })
        created++
        console.log(`Created: ${jsonName}`)
      }
    } catch (err) {
      console.error(`\nError saving ${jsonName}:`, err)
      errors++
    }

  }

  console.log(`\n\nSeed Complete!`)
  console.log(`   Created: ${created}`)
  console.log(`   Skipped: ${skipped}`)
  console.log(`   Errors:  ${errors}`)
  process.exit(0)
}

seedColleges().catch(console.error)