import { cn } from '@/utils'
import React, { type ReactNode } from 'react'

interface IProp extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
	icon: ReactNode
	text?: string
	textClass?: string
	hideTextByDefault?: boolean // 文字显隐动画
}

const IconButton: React.FC<IProp> = ({
	icon,
	text,
	hideTextByDefault: animated,
	className,
	textClass,
	...buttonProps
}) => {
	return (
		<button
			type='button'
			className={cn('flex flex-col items-center gap-1', className, {
				animated: 'transition-all duration-150 ease-in-out'
			})}
			{...buttonProps}
		>
			{icon}
			<span
				className={cn(textClass, {
					animated: 'hidden hover:block transition-all duration-150 ease-in-out'
				})}
			>
				{text}
			</span>
		</button>
	)
}

export default IconButton
