import { CollectionConfig } from 'payload'

const VALID_OPTIONS = ['A', 'B', 'C', 'D']
const DROPPED_MARKERS = ['-', 'DROP', 'BONUS']

const validateKeySet = (val: unknown, { siblingData }: { siblingData?: Record<string, unknown> }) => {
  if (!val) return 'Answer key is required'
  const expectedLength = siblingData?.subject === 'Mathematics' ? 75 : 80
  try {
    const parsed = typeof val === 'string' ? JSON.parse(val) : val
    if (!Array.isArray(parsed)) {
      return 'Must be a valid JSON array, e.g. ["A", "B", ["C", "D"], "-"]'
    }
    if (parsed.length !== expectedLength) {
      return `Answer key must have exactly ${expectedLength} items for ${siblingData?.subject || 'selected subject'}. Currently has ${parsed.length}.`
    }
    for (let i = 0; i < parsed.length; i++) {
      const item = parsed[i]
      if (Array.isArray(item)) {
        if (item.length === 0) {
          return `Item at index ${i + 1} is empty. Multiple-choice answer must contain at least one option.`
        }
        for (const sub of item) {
          if (typeof sub !== 'string' || !VALID_OPTIONS.includes(sub.toUpperCase())) {
            return `Invalid option "${sub}" at index ${i + 1}. Options must be A, B, C, or D.`
          }
        }
      } else {
        const itemStr = String(item).toUpperCase().trim()
        if (!VALID_OPTIONS.includes(itemStr) && !DROPPED_MARKERS.includes(itemStr)) {
          return `Invalid option "${item}" at index ${i + 1}. Must be A, B, C, D, or dropped marker (-/DROP).`
        }
      }
    }
    return true
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return 'Invalid JSON format: ' + message
  }
}

export const AnswerKeys: CollectionConfig = {
  slug: 'answer-keys',
  admin: {
    useAsTitle: 'subject',
    group: 'Exam Tools',
    defaultColumns: ['subject', 'year', 'updatedAt'],
  },
  access: {
    read: () => true, // Anyone can read answer keys
  },
  fields: [
    {
      name: 'subject',
      type: 'select',
      options: [
        { label: 'Mathematics (75 Questions)', value: 'Mathematics' },
        { label: 'Physics & Chemistry (80 Questions)', value: 'Physics/Chemistry' },
      ],
      required: true,
      unique: true,
    },
    {
      name: 'year',
      type: 'number',
      defaultValue: 2026,
      required: true,
    },
    {
      name: 'setA',
      type: 'textarea',
      label: 'SET A Keys (JSON Format)',
      required: true,
      validate: validateKeySet,
      admin: {
        description: 'Provide keys as JSON array. Example: ["A", "B", ["C", "D"], "-"]',
      },
    },
    {
      name: 'setB',
      type: 'textarea',
      label: 'SET B Keys (JSON Format)',
      required: true,
      validate: validateKeySet,
      admin: {
        description: 'Provide keys as JSON array.',
      },
    },
    {
      name: 'setC',
      type: 'textarea',
      label: 'SET C Keys (JSON Format)',
      required: true,
      validate: validateKeySet,
      admin: {
        description: 'Provide keys as JSON array.',
      },
    },
    {
      name: 'setD',
      type: 'textarea',
      label: 'SET D Keys (JSON Format)',
      required: true,
      validate: validateKeySet,
      admin: {
        description: 'Provide keys as JSON array.',
      },
    },
  ],
}
