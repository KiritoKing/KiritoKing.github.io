import { getCollection, type CollectionEntry } from 'astro:content'

export const getCategories = async () => {
	const posts = await getCollection('blog')
	const categories = new Set(posts.map((post) => post.data.category))
	return Array.from(categories)
}

export const getPosts = async (max?: number) => {
	return (await getCollection('blog'))
		.filter((post) => !post.data.draft)
		.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
		.slice(0, max)
}

export const getTags = async () => {
	const posts = await getCollection('blog')
	const tags = new Set(posts.map((post) => post.data.tags).flat())
	return Array.from(tags)
}

export const getPostByTag = async (tag: string) => {
	const posts = await getPosts()
	return posts.filter((post) => post.data.tags.includes(tag))
}

export const getRelatedPosts = async (post: CollectionEntry<'blog'>, postNum = 3) => {
	const posts = await getPosts()
	const relatedPosts = posts.filter(
		(p) => p.slug !== post.slug && p.data.tags.some((t) => post.data.tags.includes(t))
	)
	return relatedPosts.slice(0, postNum)
}

export const filterPostsByCategory = async (category: string) => {
	const posts = await getPosts()
	return posts.filter((post) => post.data.category.toLowerCase() === category)
}
