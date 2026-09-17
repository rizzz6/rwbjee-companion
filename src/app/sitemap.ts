import { MetadataRoute } from 'next'
import { getPayloadClient } from '@/lib/payload-client'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.rwbjee.com'

  // 1. Fetch Data from Payload
  const payload = await getPayloadClient()
  
  // Fetch only published blog posts
  const postRes = await payload.find({
    collection: 'posts',
    where: {
      _status: { equals: 'published' }
    },
    limit: 1000,
    pagination: false,
  })
  const posts = postRes.docs.map(doc => ({
    slug: doc.slug,
    updatedAt: doc.updatedAt,
  }))

  // Fetch visible colleges
  const collegeRes = await payload.find({
    collection: 'colleges',
    where: { 
      isVisible: { equals: true } 
    },
    limit: 1000,
    pagination: false,
  })
  const colleges = collegeRes.docs.map(doc => ({
    slug: doc.slug,
    updatedAt: doc.updatedAt,
  }))

  // 2. Define Static Pages
  const defaultLastMod = new Date('2025-01-01')
  
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: defaultLastMod,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/predictor`,
      lastModified: defaultLastMod,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/cutoffs`,
      lastModified: defaultLastMod,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/marks-calculator`,
      lastModified: defaultLastMod,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/colleges`,
      lastModified: defaultLastMod,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: defaultLastMod,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/timeline`,
      lastModified: defaultLastMod,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/socials`,
      lastModified: defaultLastMod,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: defaultLastMod,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: defaultLastMod,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/disclaimer`,
      lastModified: defaultLastMod,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
  ]

  // 3. Generate Dynamic Blog URLs
  const blogRoutes: MetadataRoute.Sitemap = posts.map((post: { slug: string; updatedAt?: string }) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt || new Date()),
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  // 4. Generate Dynamic College URLs
  const collegeRoutes: MetadataRoute.Sitemap = colleges.map((college: { slug: string; updatedAt?: string }) => ({
    url: `${baseUrl}/colleges/${college.slug}`,
    lastModified: new Date(college.updatedAt || new Date()),
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  // 5. Combine and Return
  return [...staticRoutes, ...blogRoutes, ...collegeRoutes]
}
