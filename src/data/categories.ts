import fs from 'fs'
import path from 'path'

const categoryPath = path.join(process.cwd(), 'src', 'content', 'blog')

function getSubdirectories(dirPath: string) {
	// 使用 fs 模块读取目录内容
	const entries = fs.readdirSync(dirPath, { withFileTypes: true })

	// 过滤出是目录的项
	const subdirectories = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name)

	return subdirectories
}

// List of categories for blog posts
export const CATEGORIES = ['Development', 'Algorithm', 'Technology', 'Life'] as const
