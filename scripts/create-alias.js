const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const yaml = require('yaml');
const dayjs = require('dayjs');

// 递归读取目录下的所有文件
function getAllMarkdownFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(path.join(dirPath, file)).isDirectory()) {
      arrayOfFiles = getAllMarkdownFiles(path.join(dirPath, file), arrayOfFiles);
    } else {
      if (path.extname(file) === '.md') {
        arrayOfFiles.push(path.join(dirPath, file));
      }
    }
  });

  return arrayOfFiles;
}

// 生成 alias 字段
function generateAlias(filePath, frontmatter, baseDir) {
  const relativePath = path.relative(baseDir, filePath);
  const parts = relativePath.split(path.sep);
  const category = parts[0];
  const fileName = path.basename(filePath, '.md');
  const aliasValue = `post/${category}/${fileName}/index.html`;
  return aliasValue;
}

// 更新文件的 frontmatter
function updateFrontmatter(filePath, alias) {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const parsed = matter(fileContent);
  parsed.data.alias = alias;
  const newContent = matter.stringify(parsed.content, parsed.data);
  fs.writeFileSync(filePath, newContent, 'utf8');
}

// 主处理逻辑
function processMarkdownFiles(baseDir) {
  const markdownFiles = getAllMarkdownFiles(baseDir);

  markdownFiles.forEach(filePath => {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const parsed = matter(fileContent);

    if (parsed.data.date) {
      try {
        const alias = generateAlias(filePath, parsed.data, baseDir);
        updateFrontmatter(filePath, alias);
      } catch (err) {
        console.error(err.message);
      }
    }
  });
}

const baseDir = path.join(__dirname, 'source/_posts'); // 你的目录路径
processMarkdownFiles(baseDir);