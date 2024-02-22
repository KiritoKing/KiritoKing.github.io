import { cn } from 'src/utils/cn'
import React, { type ReactNode } from 'react'

interface IProp extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
	icon: ReactNode
	text?: string
	textClass?: string
	animated?: boolean // 文字显隐动画
}

const IconButton: React.FC<IProp> = ({
	icon,
	text,
	animated,
	className,
	textClass,
	...buttonProps
}) => {
	return (
		<button
			type='button'
			className={cn(
				'flex flex-col items-center justify-center group',
				{
					'transition duration-300 transform-gpu hover:-translate-y-1': animated
				},
				className
			)}
			{...buttonProps}
		>
			<span>{icon}</span>
			<span className={cn(textClass, 'transition duration-300 group-hover:opacity-100')}>
				{text}
			</span>
		</button>
	)
}

export default IconButton
