import { type ImgHTMLAttributes, forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../lib/utils'

const avatarVariants = cva(
  'relative inline-flex shrink-0 items-center justify-center rounded-full overflow-hidden',
  {
    variants: {
      size: {
        sm: 'h-7  w-7  text-xs',
        md: 'h-9  w-9  text-sm',
        lg: 'h-11 w-11 text-base',
        xl: 'h-14 w-14 text-lg',
      },
    },
    defaultVariants: { size: 'md' },
  },
)

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

export interface AvatarProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'>,
    VariantProps<typeof avatarVariants> {
  src?:  string
  name?: string
}

export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(
  ({ src, name, alt, size, className, ...props }, ref) => {
    const initials = name ? getInitials(name) : null

    return (
      <span
        ref={ref}
        className={cn(avatarVariants({ size }), className)}
        aria-label={alt ?? name ?? 'Avatar'}
        role="img"
      >
        {src ? (
          <img
            src={src}
            alt={alt ?? name ?? ''}
            className="h-full w-full object-cover"
            {...(props as ImgHTMLAttributes<HTMLImageElement>)}
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-brand-100 font-semibold text-brand-700 select-none">
            {initials ?? '?'}
          </span>
        )}
      </span>
    )
  },
)
Avatar.displayName = 'Avatar'
