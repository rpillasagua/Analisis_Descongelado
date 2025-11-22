import * as React from "react"

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
    required?: boolean;
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
    ({ className = '', required = false, children, ...props }, ref) => (
        <label
            ref={ref}
            className={`text-xs font-semibold text-[#262626] mb-2 block uppercase tracking-wider ${className}`}
            {...props}
        >
            {children}
            {required && <span className="text-red-500 ml-1">*</span>}
        </label>
    )
)
Label.displayName = "Label"

export { Label }
