import React, { useMemo } from 'react'
import { cn } from '@/utils'
import UpIcon from '../icons/Up'
import DownIcon from '../icons/Down'
import IconButton from '../IconButton'

interface TableOfContent {
	depth: number
	text: string
	slug: string
	subheadings?: TableOfContent[]
}

interface IProps {
	headings?: TableOfContent[]
}

const TOCItem = ({ heading }: { heading: TableOfContent }) => {
	return (
		<li className='flex flex-col'>
			<a
				href={'#' + heading.slug}
				className={cn(
					`bg-slate-200 dark:bg-slate-800 dark:hover:bg-indigo-400 hover:bg-indigo-300 hover:text-white  py-1 px-4 dark:text-white rounded-full mb-2 first-letter:uppercase w-fit line-clamp-2`
				)}
			>
				{heading.text}
			</a>
			{heading.subheadings && heading.subheadings.length > 0 && (
				<ul className='ml-3'>
					{heading.subheadings.map((subheading) => (
						<TOCItem heading={subheading} />
					))}
				</ul>
			)}
		</li>
	)
}

const TableOfContents: React.FC<IProps> = ({ headings } = {}) => {
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

	return (
		<nav className='max-w-xs dark:text-black'>
			<div className='flex w-full justify-between'>
				<h1 className='font-bold mb-3 text-2xl dark:text-white'>文章目录</h1>
				<div className='flex gap-2'>
					<IconButton
						hideTextByDefault
						icon={<UpIcon width='1.5rem' height='1.5rem' />}
						text='回到顶部'
					/>
					<button type='button'></button>
					<button type='button'>
						<DownIcon width='1.5rem' height='1.5rem' />
					</button>
				</div>
			</div>
			<ul id='toc' className='[text-wrap:balance] flex flex-col gap-1'>
				{toc.map((heading) => (
					<TOCItem heading={heading} />
				))}
			</ul>
		</nav>
	)
}

export default TableOfContents
