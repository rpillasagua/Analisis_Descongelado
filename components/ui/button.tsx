import * as React from "react"
import { Loader2 } from "lucide-react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'outline' | 'ghost' | 'destructive';
    size?: 'default' | 'sm' | 'lg';
    isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = '', variant = 'default', size = 'default', isLoading = false, disabled, children, ...props }, ref) => {
        const baseClasses = "inline-flex items-center justify-center rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"

        const variantClasses = {
            default: 'bg-[#0095f6] text-white hover:bg-[#1877f2] shadow-sm active:scale-95',
            outline: 'bg-white text-[#262626] border border-[#dbdbdb] hover:bg-gray-50 active:scale-95',
            ghost: 'text-[#8e8e8e] hover:text-[#262626] hover:bg-gray-100 active:scale-95',
            destructive: 'bg-red-600 text-white hover:bg-red-700 shadow-sm active:scale-95'
        }

        const sizeClasses = {
            default: 'h-10 px-4 text-sm',
            sm: 'h-8 px-3 text-xs',
            lg: 'h-12 px-6 text-base'
        }

        return (
            <button
                className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
                ref={ref}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {children}
            </button>
        )
    }
)
Button.displayName = "Button"

export { Button }
