import * as React from "react"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: boolean;
    success?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className = '', error = false, success = false, type, ...props }, ref) => {
        const baseClasses = "w-full px-4 py-3 text-sm bg-[#fafafa] border rounded-lg focus:outline-none transition-all placeholder-[#8e8e8e] text-[#262626] font-mono"

        const stateClasses = error
            ? "border-red-500 bg-red-50 focus:border-red-600 focus:ring-2 focus:ring-red-200"
            : success
                ? "border-green-500 bg-green-50 focus:border-green-600 focus:ring-2 focus:ring-green-200"
                : "border-[#dbdbdb] focus:border-[#a8a8a8] focus:ring-2 focus:ring-blue-100"

        return (
            <input
                type={type}
                className={`${baseClasses} ${stateClasses} ${className}`}
                ref={ref}
                {...props}
            />
        )
    }
)
Input.displayName = "Input"

export { Input }
