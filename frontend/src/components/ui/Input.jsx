import React from 'react';
import { cn } from '../../lib/utils';
import { FiEye, FiEyeOff } from 'react-icons/fi';

const Input = React.forwardRef(({ className, label, error, type = "text", ...props }, ref) => {
    const isPasswordField = type === 'password';
    const [showPassword, setShowPassword] = React.useState(false);

    React.useEffect(() => {
        if (!isPasswordField && showPassword) {
            setShowPassword(false);
        }
    }, [isPasswordField, showPassword]);

    const resolvedType = isPasswordField && showPassword ? 'text' : type;

    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">
                    {label}
                </label>
            )}
            <div className="relative">
                <input
                    type={resolvedType}
                    className={cn(
                        "flex h-11 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/25 focus:border-primary-500 disabled:cursor-not-allowed disabled:opacity-50 hover:border-gray-400",
                        isPasswordField && "pr-20",
                        error && "border-red-500 focus:ring-red-500 focus:border-red-500",
                        className
                    )}
                    ref={ref}
                    {...props}
                />
                {isPasswordField && (
                    <button
                        type="button"
                        className="absolute inset-y-0 right-3 my-auto inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-500 hover:text-primary-700 hover:bg-primary-50 transition-colors"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                        title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                    >
                        {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                    </button>
                )}
            </div>
            {error && (
                <p className="mt-1 text-xs text-red-600 ml-1 font-medium">{error}</p>
            )}
        </div>
    );
});

Input.displayName = "Input";
export default Input;
