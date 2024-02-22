import React, { useEffect, useRef, useState } from 'react'
import { cn } from 'src/utils/cn'
import type { TableOfContent } from './TOC'

interface IProps {
	heading: TableOfContent
	parent?: HTMLElement
}

// 在全局声明, 所有目录组件共用一个滚动锁 (禁止点击时滚动目录)
let isClickingIndex = false

export const TOCItem = ({ heading, parent }: IProps) => {
	const [isInView, setIsInView] = useState(false)
	const el = useRef<HTMLAnchorElement>(null)

	useEffect(() => {
		// 这里是观察对应的标题是否进入ViewPort,因此需要获取对应Element
		const anchor = document.getElementById(heading.slug)
		if (!anchor) return

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) setIsInView(true)
					else setIsInView(false)
				})
			},
			{
				root: null,
				rootMargin: ' 15% 0px 0% 0px ',
				threshold: 1
			}
		)
		observer.observe(anchor)
	}, [])

	useEffect(() => {
		if (isClickingIndex || !parent || !el.current) return
		// 当目录表中的高亮元素不在ViewPort时自动滚动
		const isAnchorInView =
			el.current.offsetTop > parent.scrollTop &&
			el.current.offsetTop < parent.scrollTop + parent.clientHeight

		if (isInView && !isAnchorInView) {
			const targetParentScrollTop = el.current.offsetTop - parent.offsetHeight / 2
			// 防止溢出
			if (targetParentScrollTop <= 0) parent.scrollTop = 0
			else if (targetParentScrollTop >= parent.scrollHeight)
				parent.scrollTop = parent.scrollHeight - parent.clientHeight
			else parent.scrollTop = targetParentScrollTop
		}
	}, [isInView])

	return (
		<li className='flex flex-col'>
			<a
				ref={el}
				onClick={() => {
					isClickingIndex = true
					setTimeout(() => {
						isClickingIndex = false
					}, 500)
				}}
				href={`#${heading.slug}`}
				className={cn(
					`transition-colors duration-200 dark:hover:bg-indigo-400 hover:bg-indigo-300 hover:text-white  py-1 px-4 dark:text-white rounded-full mb-2 first-letter:uppercase w-fit line-clamp-2`,
					isInView
						? 'bg-indigo-600 dark:bg-indigo-700 text-white'
						: 'bg-slate-200 dark:bg-slate-800'
				)}
			>
				{heading.text}
			</a>
			{heading.subheadings && heading.subheadings.length > 0 && (
				<ul className='ml-3'>
					{heading.subheadings.map((subheading) => (
						<TOCItem key={subheading.slug} heading={subheading} parent={parent} />
					))}
				</ul>
			)}
		</li>
	)
}

export default TOCItem
