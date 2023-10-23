const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')
const glob = require('glob')

function processMarkdownFiles(dir, callback) {
	// 使用 glob 模块查找目录中的所有 .md 文件
	const files = glob.sync(`${dir}/**/*.md`, { nodir: true })

	// 遍历找到的 .md 文件
	files.forEach((file) => {
		const data = fs.readFileSync(file, 'utf8')
		let frontMatterEnd = data.indexOf('---', 4)
		if (frontMatterEnd === -1) {
			console.error(`Front matter not found in ${file}`)
			return
		}
		console.log(`\n[Reading front matter from ${file}]`)
		// 从文件内容中提取 front matter 部分
		const frontMatterString = data.substring(4, frontMatterEnd)
		const frontMatter = yaml.load(frontMatterString)

		// 使用回调函数修改 front matter，并获取修改后的内容
		const modifiedFrontMatter = callback(frontMatter)

		// 将修改后的 front matter 转换为 YAML 字符串
		const modifiedFrontMatterString = yaml.dump(modifiedFrontMatter)

		// 将修改后的 front matter 替换原文件中的 front matter 部分
		const updatedContent = data.replace(frontMatterString, modifiedFrontMatterString)

		// 将修改后的内容写回文件
		fs.writeFileSync(file, updatedContent, 'utf8')
	})
}

// 用法示例：
const directoryPath = 'src/content/blog' // 替换为你的目录路径

processMarkdownFiles(directoryPath, (frontMatter) => {
	let modified = false

	const convertMap = {
		date: 'pubDate',
		excerpt: 'description',
		cover: 'heroImage',
		abbrlink: 'slug'
	}
	Object.entries(convertMap).forEach(([key, value]) => {
		if (frontMatter[key]) {
			modified = true
			frontMatter[value] = frontMatter[key]
			delete frontMatter[key]
			console.log(`Convert ${key} to ${value}`)
		}
	})

	// if (
	// 	frontMatter['tags'] &&
	// 	frontMatter['tags'] instanceof Array &&
	// 	frontMatter['tags'].length > 0
	// ) {
	// 	// 拍平数组并去除前后的引号
	// 	frontMatter['tags'] = JSON.stringify(frontMatter['tags']).replace(/^[']|[']$/g, '')
	// 	modified = true
	// 	console.log('Convert tags to string')
	// }

	if (
		frontMatter['categories'] &&
		frontMatter['categories'] instanceof Array &&
		frontMatter['categories'].length > 0
	) {
		// 只留下第一个分类
		frontMatter['category'] = frontMatter['categories'][0]
		delete frontMatter['categories']
		modified = true
		console.log('Convert categories to string')
	}

	if (!modified) {
		console.log('No need to convert front matter')
	}
	return frontMatter // 返回修改后的 front matter
})
