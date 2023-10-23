interface SiteConfig {
	author: string
	title: string
	description: string
	lang: string
	ogLocale: string
	shareMessage: string
}

export const siteConfig: SiteConfig = {
	author: 'Chlorine Chen',
	title: 'ChlorineC 的编程小窝',
	description: '记录从前端到全栈的所有开发历程',
	lang: 'zh_CN',
	ogLocale: 'zh_CN',
	shareMessage: '这个人写的博客很不错，快来看看吧！' // Message to share a post on social media
}
