import React from 'react';
import { cn } from '../../lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      ...props
    },
    ref
  ) => {
    // Button variants
    const variants = {
      primary: 'bg-primary-500 hover:bg-primary-600 text-dark-800 shadow-sm hover:shadow-neon-blue transition-all',
      secondary: 'bg-secondary-500 hover:bg-secondary-600 text-white shadow-sm hover:shadow-neon-red transition-all',
      outline: 'bg-transparent border border-primary-500 text-primary-500 hover:bg-primary-500/10',
      ghost: 'bg-transparent hover:bg-dark-700 text-gray-200',
      link: 'bg-transparent text-primary-500 hover:underline p-0 h-auto',
      danger: 'bg-error hover:bg-error/90 text-white',
    };

    // Button sizes
    const sizes = {
      sm: 'text-xs px-3 py-1.5 rounded',
      md: 'text-sm px-4 py-2 rounded-md',
      lg: 'text-base px-6 py-3 rounded-md',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'font-medium flex items-center justify-center transition-colors',
          variants[variant],
          sizes[size],
          fullWidth ? 'w-full' : '',
          (disabled || isLoading) ? 'opacity-50 cursor-not-allowed' : '',
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <span className="mr-2">
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </span>
        )}
        {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;