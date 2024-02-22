import React, { useCallback, useEffect, useMemo, useState } from 'react'
import UpIcon from '../icons/Up'
import DownIcon from '../icons/Down'
import IconButton from '../IconButton'
import TOCItem from './TOCItem'

export interface TableOfContent {
	depth: number
	text: string
	slug: string
	subheadings?: TableOfContent[]
}

interface IProps {
	headings?: TableOfContent[]
}

const TableOfContents: React.FC<IProps> = ({ headings }) => {
	const [tocElement, setTocElement] = useState<HTMLElement>()

	const toc = useMemo(() => {
		let toc: TableOfContent[] = []
		if (!headings || headings.length === 0) return toc
		let parentHeadings = new Map()
		headings.forEach((h) => {
			let heading = { ...h, subheadings: [] }
			parentHeadings.set(heading.depth, heading)
			// Change 2 to 1 if your markdown includes your <h1>
			if (heading.depth === 1 || heading.depth === 2) {
				toc.push(heading)
			} else {
				parentHeadings.get(heading.depth - 1)?.subheadings?.push(heading)
			}
		})
		return toc
	}, [headings])

	const handleGoTop = () => {
		window.scrollTo({ top: 0, behavior: 'smooth' })
	}

	const handleGoBottom = () => {
		window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
	}

	return (
		<nav className='max-w-sm dark:text-black'>
			{/* 操作按钮 */}
			<div className='flex w-full justify-between'>
				<h1 className='font-bold mb-3 text-2xl dark:text-white'>文章目录</h1>
				<div className='flex gap-2'>
					<IconButton
						animated
						aria-label='go to top'
						textClass='text-sm text-gray-500'
						icon={<UpIcon width='1.5rem' height='1.5rem' className='dark:text-white' />}
						onClick={handleGoTop}
					/>
					<button type='button'></button>
					<IconButton
						animated
						aria-label='go to bottom'
						textClass='text-sm text-gray-500'
						icon={<DownIcon width='1.5rem' height='1.5rem' className='dark:text-white' />}
						onClick={handleGoBottom}
					/>
				</div>
			</div>
			{/* 目录 */}
			<ul
				ref={(el) => {
					if (el) setTocElement(el)
				}}
				id='toc'
				className='[text-wrap:balance] flex flex-col gap-1 scroll-smooth overflow-y-auto max-h-[calc(100vh-16rem)]'
			>
				{toc.map((heading) => (
					<TOCItem key={heading.slug} heading={heading} parent={tocElement} />
				))}
			</ul>
		</nav>
	)
}

export default TableOfContents
