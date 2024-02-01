import { defineConfig } from 'tinacms'

// Your hosting provider likely exposes this as an environment variable
const branch =
	process.env.GITHUB_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || process.env.HEAD || 'main'

export default defineConfig({
	branch,

	// Get this from tina.io
	clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID,
	// Get this from tina.io
	token: process.env.TINA_TOKEN,

	build: {
		outputFolder: 'admin',
		publicFolder: 'public'
	},
	media: {
		tina: {
			mediaRoot: '',
			publicFolder: 'public'
		}
	},
	// See docs on content modeling for more info on how to setup new content models: https://tina.io/docs/schema/
	schema: {
		collections: [
			{
				name: 'blogs',
				label: 'Blogs',
				path: 'src/content/blog',
				fields: [
					{
						type: 'string',
						name: 'title',
						label: 'Title',
						isTitle: true,
						required: true
					},
					{
						type: 'string',
						name: 'slug',
						label: 'Slug'
					},
					{
						type: 'string',
						name: 'description',
						label: 'Description'
					},
					{
						type: 'datetime',
						name: 'pubDate',
						label: 'Publication Date'
					},
					{
						type: 'image',
						name: 'heroImage',
						label: 'Hero Image'
					},
					{
						type: 'string',
						name: 'category',
						label: 'Category'
					},
					{
						type: 'string',
						name: 'tags',
						label: 'Tags',
						list: true
					},
					{
						type: 'boolean',
						name: 'draft',
						label: 'Draft'
					},
					{
						type: 'rich-text',
						label: 'Body',
						name: 'SButton',
						isBody: true
					}
				]
			}
		]
	}
})
