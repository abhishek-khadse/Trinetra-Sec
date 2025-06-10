import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glowEffect?: 'blue' | 'red' | 'none';
  isHoverable?: boolean;
}

const Card = ({
  children,
  className,
  glowEffect = 'none',
  isHoverable = false,
}: CardProps) => {
  const glowStyles = {
    blue: 'border-primary-500/30 hover:shadow-neon-blue',
    red: 'border-secondary-500/30 hover:shadow-neon-red',
    none: '',
  };

  return (
    <div
      className={cn(
        'bg-dark-700 border rounded-lg overflow-hidden transition-all duration-200',
        isHoverable && 'hover:translate-y-[-4px]',
        glowStyles[glowEffect],
        className
      )}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn('p-4 border-b border-dark-600', className)}>
      {children}
    </div>
  );
};

export const CardTitle = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <h3 className={cn('text-lg font-semibold text-white', className)}>
      {children}
    </h3>
  );
};

export const CardDescription = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <p className={cn('text-sm text-gray-400 mt-1', className)}>
      {children}
    </p>
  );
};

export const CardContent = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return <div className={cn('p-4', className)}>{children}</div>;
};

export const CardFooter = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn('p-4 border-t border-dark-600 bg-dark-700/50', className)}
    >
      {children}
    </div>
  );
};

export default Card;