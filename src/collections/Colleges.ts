import { CollectionConfig } from 'payload'
import { revalidateCollection } from '../hooks/revalidate'

import {
  convertParagraphsToRichText,
  getAboutParagraphs,
  getPayloadEditorConfig,
  normalizeHighlightItems,
} from '@/utils/payload-richtext'

export const Colleges: CollectionConfig = {
  slug: 'colleges',
  admin: {
    useAsTitle: 'name',
    group: 'Content',
    defaultColumns: ['name', 'type', 'location', 'isVisible', 'priority'],
    preview: (doc, { token }) => {
      const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || ''
      return `${serverUrl}/api/preview?url=/colleges/${doc.slug}&token=${token}`
    },
  },
  versions: {
    drafts: {
      autosave: true,
    },
    maxPerDoc: 50,
  },
  hooks: {
    afterChange: [
      revalidateCollection((doc) => {
        const d = doc as { slug: string }
        return ['/colleges', `/colleges/${d.slug}`, '/']
      }),
    ],
    afterDelete: [
      revalidateCollection((doc) => {
        const d = doc as { slug: string }
        return ['/colleges', `/colleges/${d.slug}`, '/']
      }),
    ],
    afterRead: [
      ({ doc, findMany, req }) => {
        if (findMany) {
          return doc
        }

        if (!doc.overview) {
          doc.overview = doc.body || convertParagraphsToRichText({
            editorConfig: getPayloadEditorConfig(req.payload.config.editor),
            paragraphs: getAboutParagraphs(doc.about),
          })
        }

        doc.highlights = normalizeHighlightItems(doc.highlights)

        if (!doc.cutoffSourceName) {
          if (typeof doc.cutoffIdentifier === 'string') {
            doc.cutoffSourceName = doc.cutoffIdentifier
          } else if (doc.cutoffIdentifier && typeof doc.cutoffIdentifier === 'object' && 'institute' in doc.cutoffIdentifier) {
            doc.cutoffSourceName = typeof doc.cutoffIdentifier.institute === 'string' ? doc.cutoffIdentifier.institute : undefined
          }
        }

        return doc
      },
    ],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Basic Info',
          fields: [
            { name: 'name', type: 'text', required: true },
            { name: 'slug', type: 'text', required: true, unique: true },
            { name: 'shortName', type: 'text' },
            { name: 'location', type: 'text' },
            {
              name: 'type',
              type: 'select',
              options: [
                { label: 'University', value: 'University' },
                { label: 'Government', value: 'Government' },
                { label: 'Private', value: 'Private' },
                { label: 'State Govt Engineering College', value: 'State Govt Engineering' },
                { label: 'State Govt Pharmacy College', value: 'State Govt Pharmacy' },
                { label: 'Central Govt Engineering College', value: 'Central Govt Engineering' },
                { label: 'Private University', value: 'Private University' },
                { label: 'Private Engineering College', value: 'Private Engineering' },
                { label: 'Standalone Private Pharmacy College', value: 'Standalone Private Pharmacy' },
              ],
            },
            { name: 'website', type: 'text' },
            { name: 'estYear', type: 'number' },
          ],
        },
        {
          label: 'Content',
          fields: [
            { name: 'seoDescription', type: 'textarea' },
            {
              name: 'overview',
              type: 'richText',
              admin: {
                description: 'Main overview content rendered in the About the Institute section.',
              },
            },
            {
              name: 'highlights',
              type: 'array',
              fields: [{ name: 'text', type: 'text', required: true }],
            },
          ],
        },
        {
          label: 'Media',
          fields: [
            { name: 'logo', type: 'upload', relationTo: 'media' },
            { name: 'coverImage', type: 'upload', relationTo: 'media' },
          ],
        },
        {
          label: 'Stats',
          fields: [
            {
              name: 'rankingHistory',
              type: 'array',
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'agency', type: 'text', required: true, admin: { width: '50%' } },
                    { name: 'year', type: 'number', required: true, admin: { width: '50%' } },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'rank', type: 'number', required: true, admin: { width: '50%' } },
                    { name: 'stream', type: 'text', admin: { width: '50%' } },
                  ],
                },
                { name: 'notes', type: 'textarea' },
              ],
            },
            {
              name: 'feesStats',
              type: 'group',
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'totalCourseFeeAmount', type: 'number', admin: { width: '40%' } },
                    { name: 'semesterFeeAmount', type: 'number', admin: { width: '40%' } },
                    {
                      name: 'currencyCode',
                      type: 'select',
                      defaultValue: 'INR',
                      options: [
                        { label: 'INR', value: 'INR' },
                        { label: 'USD', value: 'USD' },
                      ],
                      admin: { width: '20%' },
                    },
                  ],
                },
                { name: 'feeNotes', type: 'textarea' },
              ],
            },
          ],
        },
        {
          label: 'Publishing',
          fields: [
            {
              name: 'isVisible',
              type: 'checkbox',
              defaultValue: false,
              admin: { description: 'Whether the college is visible on the public site' },
            },
            {
              name: 'priority',
              type: 'number',
              defaultValue: 3,
              admin: { description: '1=Top Tier, 2=High, 3=Standard' },
            },
            {
              name: 'cutoffSourceName',
              type: 'text',
              admin: {
                description: 'Name used to match this college with cutoff source data when seeding cutoffs.',
              },
            },
          ],
        },
        {
          label: 'Placements (Snapshot)',
          fields: [
            {
              name: 'placementStats',
              type: 'group',
              admin: {
                description: 'Legacy placement data snapshot. New data should be entered in the Placement Reports collection.',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'highestPackage', type: 'text', admin: { width: '50%' } },
                    { name: 'averagePackage', type: 'text', admin: { width: '50%' } },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'nirfMedianSalary', type: 'text', admin: { width: '50%' } },
                    {
                      name: 'sourceReliability',
                      type: 'select',
                      options: [
                        { label: 'High', value: 'High' },
                        { label: 'Medium', value: 'Medium' },
                        { label: 'Low', value: 'Low' },
                        { label: 'Official', value: 'Official' },
                      ],
                      admin: { width: '50%' },
                    },
                  ],
                },
                { name: 'dataSource', type: 'text' },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'about',
      type: 'group',
      admin: {
        hidden: true,
      },
      fields: [
        { name: 'para1', type: 'textarea' },
        { name: 'para2', type: 'textarea' },
      ],
    },
    {
      name: 'body',
      type: 'richText',
      admin: {
        hidden: true,
      },
    },
    {
      name: 'cutoffIdentifier',
      type: 'relationship',
      relationTo: 'college_cutoffs',
      admin: {
        hidden: true,
      },
    },
  ],
}