import * as React from "react"

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    error?: boolean;
    autoResize?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className = '', error = false, autoResize = false, onChange, ...props }, ref) => {
        const textareaRef = React.useRef<HTMLTextAreaElement>(null);

        React.useImperativeHandle(ref, () => textareaRef.current!);

        const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            if (autoResize && textareaRef.current) {
                textareaRef.current.style.height = 'auto';
                textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
            }
            onChange?.(e);
        };

        const baseClasses = "w-full px-4 py-3 text-sm bg-[#fafafa] border rounded-lg focus:outline-none transition-all placeholder-[#8e8e8e] text-[#262626] min-h-[100px] resize-none"

        const stateClasses = error
            ? "border-red-500 bg-red-50 focus:border-red-600 focus:ring-2 focus:ring-red-200"
            : "border-[#dbdbdb] focus:border-[#a8a8a8] focus:ring-2 focus:ring-blue-100"

        return (
            <textarea
                className={`${baseClasses} ${stateClasses} ${className}`}
                ref={textareaRef}
                onChange={handleChange}
                {...props}
            />
        )
    }
)
Textarea.displayName = "Textarea"

export { Textarea }
