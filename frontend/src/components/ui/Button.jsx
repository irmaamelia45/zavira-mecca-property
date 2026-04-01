import React from 'react';
import { cn } from '../../lib/utils';
import { FaSpinner } from 'react-icons/fa';

const Button = React.forwardRef(({ className, variant = 'primary', size = 'md', isLoading = false, children, ...props }, ref) => {
    const variants = {
        primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-sm hover:shadow-md',
        secondary: 'bg-primary-900 text-white hover:bg-primary-800 focus:ring-primary-900 shadow-sm hover:shadow-md',
        outline: 'border border-secondary-500 text-primary-900 hover:bg-secondary-100 focus:ring-primary-500',
        ghost: 'text-primary-900 hover:bg-secondary-50 focus:ring-primary-500',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    };

    const sizes = {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 py-2',
        lg: 'h-12 px-6 text-lg',
    };

    return (
        <button
            ref={ref}
            className={cn(
                'inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]',
                variants[variant],
                sizes[size],
                className
            )}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading && <FaSpinner className="mr-2 h-4 w-4 animate-spin" />}
            {children}
        </button>
    );
});

Button.displayName = "Button";
export default Button;
