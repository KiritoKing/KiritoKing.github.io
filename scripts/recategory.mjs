import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'

const baseUrl = path.join(process.cwd(), 'src', 'content', 'blog')

// 处理一个Markdown文件
function processMarkdownFile(filePath) {
	// 读取文件内容
	const content = fs.readFileSync(filePath, 'utf-8')

	// 通过正则表达式匹配front matter
	const frontMatterMatch = content.match(/^---\s*([\s\S]*?)\s*---/)

	if (frontMatterMatch) {
		const frontMatterText = frontMatterMatch[1]
		try {
			// 解析yaml格式的front matter
			const frontMatter = yaml.load(frontMatterText)

			// 删除slug字段
			delete frontMatter.slug

			// 更改category字段
			if (frontMatter.category) {
				switch (frontMatter.category) {
					case '面试经验':
					case '前端':
					case '软件工程':
					case '杂食编程':
						frontMatter.category = 'Development'
						break
					case '刷题笔记':
						frontMatter.category = 'Research'
						break
					case '折腾日志':
						frontMatter.category = 'Technology'
						break
					case '随笔':
						frontMatter.category = 'Life'
						break
					// 添加其他可能的category映射
					// case '其他分类':
					//   frontMatter.category = '其他映射';
					//   break;
					default:
						// 保留未匹配的category
						break
				}
			}

			// 将修改后的front matter写回文件
			const updatedFrontMatter = '---\n' + yaml.dump(frontMatter) + '---\n'
			const updatedContent = content.replace(frontMatterMatch[0], updatedFrontMatter)
			fs.writeFileSync(filePath, updatedContent, 'utf-8')

			// 重新组织目录
			const newCategoryDirectory = path.join(baseUrl, frontMatter.category)
			if (!fs.existsSync(newCategoryDirectory)) {
				fs.mkdirSync(newCategoryDirectory, { recursive: true })
			}
			const newFilePath = path.join(newCategoryDirectory, path.basename(filePath))
			fs.renameSync(filePath, newFilePath)
		} catch (error) {
			console.error(`Error processing front matter in file ${filePath}:`, error.message)
		}
	}
}

// 递归处理目录
function processDirectory(directoryPath) {
	const files = fs.readdirSync(directoryPath)

	files.forEach((file) => {
		const filePath = path.join(directoryPath, file)
		const stats = fs.statSync(filePath)

		if (stats.isDirectory()) {
			// 递归处理子目录
			processDirectory(filePath)
		} else if (stats.isFile() && file.endsWith('.md')) {
			// 处理Markdown文件
			processMarkdownFile(filePath)
		}
	})
}

// 指定要处理的根目录
const rootDirectory = path.join(process.cwd(), 'src', 'content', 'blog')

// 开始处理
processDirectory(rootDirectory)

console.log('Processing completed.')
