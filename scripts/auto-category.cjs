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
		Development: ['前端', '面试经验', '软件工程', '杂食编程'],
		Technology: ['折腾日志'],
		Life: ['随笔']
	}

	const realMap = {}
	Object.entries(convertMap).forEach(([key, value]) => {
		value.forEach((item) => {
			realMap[item] = key
		})
	})

	if (frontMatter['category'] && realMap[frontMatter['category']]) {
		console.log(`Convert ${frontMatter['category']} to ${realMap[frontMatter['category']]}`)
		frontMatter['category'] = `${realMap[frontMatter['category']]}`
		modified = true
	}

	if (!modified) {
		console.log('No need to convert front matter')
	}
	return frontMatter // 返回修改后的 front matter
})
