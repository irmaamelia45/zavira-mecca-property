import React from 'react';
import { cn } from '../../lib/utils';

export default function Badge({ className, variant = "default", children, ...props }) {
    const variants = {
        default: "bg-primary-50 text-primary-700 border-primary-200",
        secondary: "bg-secondary-50 text-secondary-700 border-secondary-200",
        destructive: "bg-red-50 text-red-700 border-red-200",
        outline: "text-gray-950 border-gray-200",
        success: "bg-green-50 text-green-700 border-green-200",
        warning: "bg-yellow-50 text-yellow-700 border-yellow-200"
    };

    return (
        <div className={cn("inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", variants[variant], className)} {...props}>
            {children}
        </div>
    );
}
