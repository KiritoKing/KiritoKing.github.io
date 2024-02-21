// List of categories for blog posts
export const CATEGORIES = ['Development', 'Research', 'Technology', 'Life'] as const
export const CATEGORY_MAP: Record<string, string> = {
	development: '开发感悟',
	research: '研究学习',
	technology: '折腾日志',
	life: '随笔'
}
export const COLUMNS = ['React那些事'] as const
