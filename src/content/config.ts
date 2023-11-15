import { CATEGORIES } from '@/data/categories'
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
			heroImage: z.optional(image()),
			category: z.string(),
			tags: z.enum(CATEGORIES),
			draft: z.boolean().default(false)
		})
})

export const collections = { blog }
