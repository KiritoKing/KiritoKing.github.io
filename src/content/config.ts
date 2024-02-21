import { CATEGORIES, COLUMNS } from '@/data/constants'
import { getImage } from 'astro:assets'
import { defineCollection, z } from 'astro:content'

const blog = defineCollection({
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			title: z.string().max(80),
			description: z.optional(z.string()),
			// Transform string to Date object
			pubDate: z
				.string()
				.or(z.date())
				.transform((val) => new Date(val)),
			cover: z.optional(image()),
			category: z.enum(CATEGORIES),
			tags: z.array(z.string()),
			columns: z.enum(COLUMNS).optional(),
			draft: z.boolean().default(false)
		})
})

export const collections = { blog }
