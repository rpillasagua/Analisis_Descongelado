'use client';

import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
    return (
        <Sonner
            className="toaster group"
            position="top-right"
            toastOptions={{
                classNames: {
                    toast:
                        "group toast group-[.toaster]:bg-white group-[.toaster]:text-[#262626] group-[.toaster]:border-[#dbdbdb] group-[.toaster]:shadow-lg group-[.toaster]:rounded-xl",
                    description: "group-[.toast]:text-[#8e8e8e]",
                    actionButton:
                        "group-[.toast]:bg-[#0095f6] group-[.toast]:text-white",
                    cancelButton:
                        "group-[.toast]:bg-[#fafafa] group-[.toast]:text-[#262626]",
                    error: "group-[.toaster]:bg-red-50 group-[.toaster]:text-red-900 group-[.toaster]:border-red-200",
                    success: "group-[.toaster]:bg-green-50 group-[.toaster]:text-green-900 group-[.toaster]:border-green-200",
                    warning: "group-[.toaster]:bg-yellow-50 group-[.toaster]:text-yellow-900 group-[.toaster]:border-yellow-200",
                    info: "group-[.toaster]:bg-blue-50 group-[.toaster]:text-blue-900 group-[.toaster]:border-blue-200",
                },
            }}
            {...props}
        />
    )
}

export { Toaster }
