'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { designSystem, componentVariants, designUtils } from '@/lib/design-system';

/**
 * Standardized Button Component
 */
interface StandardButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export function StandardButton({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  children,
  className,
  disabled,
  ...props
}: StandardButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
  
  const variantClasses = componentVariants.button.variant[variant];
  const sizeClasses = componentVariants.button.size[size];
  
  return (
    <button
      className={cn(baseClasses, variantClasses, sizeClasses, className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {icon && iconPosition === 'left' && !loading && (
        <span className="mr-2">{icon}</span>
      )}
      {children}
      {icon && iconPosition === 'right' && !loading && (
        <span className="ml-2">{icon}</span>
      )}
    </button>
  );
}

/**
 * Standardized Card Component
 */
interface StandardCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'hover' | 'interactive';
  padding?: 'sm' | 'md' | 'lg';
}

export function StandardCard({
  variant = 'default',
  padding = 'md',
  children,
  className,
  ...props
}: StandardCardProps) {
  const baseClasses = designUtils.cardClasses(variant);
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };
  
  return (
    <div
      className={cn(baseClasses, paddingClasses[padding], className)}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Standardized Input Component
 */
interface StandardInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export function StandardInput({
  label,
  error,
  helperText,
  icon,
  className,
  ...props
}: StandardInputProps) {
  const inputClasses = cn(
    componentVariants.input.base,
    componentVariants.input.focus,
    error && componentVariants.input.error,
    icon && 'pl-10',
    className
  );

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400">{icon}</span>
          </div>
        )}
        <input
          className={inputClasses}
          {...props}
        />
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
      )}
    </div>
  );
}

/**
 * Standardized Badge Component
 */
interface StandardBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md';
}

export function StandardBadge({
  variant = 'primary',
  size = 'md',
  children,
  className,
  ...props
}: StandardBadgeProps) {
  const baseClasses = 'inline-flex items-center rounded-full font-medium';
  const variantClasses = componentVariants.badge.variant[variant];
  const sizeClasses = componentVariants.badge.size[size];
  
  return (
    <span
      className={cn(baseClasses, variantClasses, sizeClasses, className)}
      {...props}
    >
      {children}
    </span>
  );
}

/**
 * Standardized Loading Component
 */
interface StandardLoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
}

export function StandardLoading({ size = 'md', text, fullScreen = false }: StandardLoadingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const content = (
    <div className="flex items-center justify-center space-x-2">
      <svg className={`${sizeClasses[size]} animate-spin`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      {text && (
        <span className="text-sm text-gray-600 dark:text-gray-400">{text}</span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return content;
}

/**
 * Standardized Grid Component
 */
interface StandardGridProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  responsive?: boolean;
}

export function StandardGrid({
  columns = 3,
  gap = 'md',
  responsive = true,
  children,
  className,
  ...props
}: StandardGridProps) {
  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  };

  const gridClasses = responsive 
    ? designUtils.responsiveGrid(columns)
    : `grid grid-cols-${columns}`;

  return (
    <div
      className={cn(gridClasses, gapClasses[gap], className)}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Standardized Container Component
 */
interface StandardContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'sm' | 'md' | 'lg' | 'xl';
}

export function StandardContainer({
  maxWidth = 'xl',
  padding = 'md',
  children,
  className,
  ...props
}: StandardContainerProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full',
  };

  const paddingClasses = {
    sm: 'px-4',
    md: 'px-6',
    lg: 'px-8',
    xl: 'px-12',
  };

  return (
    <div
      className={cn('mx-auto', maxWidthClasses[maxWidth], paddingClasses[padding], className)}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Standardized Section Component
 */
interface StandardSectionProps extends React.HTMLAttributes<HTMLElement> {
  spacing?: 'sm' | 'md' | 'lg' | 'xl';
  background?: 'white' | 'gray' | 'transparent';
}

export function StandardSection({
  spacing = 'lg',
  background = 'white',
  children,
  className,
  ...props
}: StandardSectionProps) {
  const spacingClasses = {
    sm: 'py-8',
    md: 'py-12',
    lg: 'py-16',
    xl: 'py-20',
  };

  const backgroundClasses = {
    white: 'bg-white dark:bg-gray-900',
    gray: 'bg-gray-50 dark:bg-gray-800',
    transparent: 'bg-transparent',
  };

  return (
    <section
      className={cn(spacingClasses[spacing], backgroundClasses[background], className)}
      {...props}
    >
      {children}
    </section>
  );
}
