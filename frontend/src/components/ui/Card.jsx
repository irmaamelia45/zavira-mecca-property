import React from 'react';
import { cn } from '../../lib/utils';

export function Card({ className, children, ...props }) {
    return (
        <div data-ui="card" className={cn("rounded-lg border border-gray-200 bg-white text-gray-950 shadow-sm transition-all duration-300 hover:shadow-md hover:border-secondary-200", className)} {...props}>
            {children}
        </div>
    );
}

export function CardHeader({ className, children, ...props }) {
    return <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props}>{children}</div>;
}

export function CardTitle({ className, children, ...props }) {
    return <h3 className={cn("font-serif text-2xl font-semibold leading-none tracking-tight text-[#10214b]", className)} {...props}>{children}</h3>;
}

export function CardContent({ className, children, ...props }) {
    return <div className={cn("p-6 pt-0", className)} {...props}>{children}</div>;
}

export function CardFooter({ className, children, ...props }) {
    return <div className={cn("flex items-center p-6 pt-0", className)} {...props}>{children}</div>;
}
