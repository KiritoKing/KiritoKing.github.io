/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme')
const _ = require('lodash')

// 消除Heading中Code样式的字号与行高
const headingCodePreset = _.range(1, 6)
	.map((i) => `h${i}`)
	.map((h) => {
		return {
			[h]: {
				code: {
					fontSize: 'inherit',
					lineHeight: 'inherit'
				}
			}
		}
	})

module.exports = {
	darkMode: 'class',
	content: ['./src/**/*.{astro,html,js,md,mdx,ts}'],
	theme: {
		extend: {
			colors: {
				white: '#f8f9fa'
			},
			fontFamily: {
				body: ['Manrope', ...defaultTheme.fontFamily.sans]
			},
			gridTemplateColumns: {
				list: 'repeat(auto-fill, minmax(400px, max-content))'
			},
			typography: {
				DEFAULT: {
					css: _.merge(
						{
							code: {
								color: '#4870ac',
								padding: '2px 4px 2px',
								margin: '2px'
							}
						},
						...headingCodePreset
					)
				}
			}
		}
	},
	plugins: [require('@tailwindcss/typography')]
}
