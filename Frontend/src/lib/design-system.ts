/**
 * Design System Configuration
 * Centralized design tokens and component standards
 */

export const designSystem = {
  // Color Palette
  colors: {
    primary: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },
    secondary: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
    accent: {
      blue: '#3b82f6',
      purple: '#8b5cf6',
      pink: '#ec4899',
      orange: '#f97316',
      yellow: '#eab308',
    }
  },

  // Typography
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace'],
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    }
  },

  // Spacing
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },

  // Border Radius
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    full: '9999px',
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },

  // Breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // Animation
  animation: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    easing: {
      linear: 'linear',
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
    }
  }
};

/**
 * Component Variants
 */
export const componentVariants = {
  button: {
    size: {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 text-sm',
      lg: 'h-12 px-6 text-base',
    },
    variant: {
      primary: 'bg-green-600 hover:bg-green-700 text-white',
      secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900',
      outline: 'border border-gray-300 hover:bg-gray-50 text-gray-700',
      ghost: 'hover:bg-gray-100 text-gray-700',
    }
  },
  
  card: {
    base: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm',
    hover: 'hover:shadow-md transition-shadow duration-200',
    interactive: 'hover:scale-105 transition-transform duration-200',
  },

  input: {
    base: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
    focus: 'focus:ring-2 focus:ring-green-500 focus:border-green-500',
    error: 'border-red-500 focus:ring-red-500',
  },

  badge: {
    size: {
      sm: 'px-2 py-1 text-xs',
      md: 'px-3 py-1 text-sm',
    },
    variant: {
      primary: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      secondary: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      success: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      error: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    }
  }
};

/**
 * Layout Standards
 */
export const layoutStandards = {
  container: {
    maxWidth: '1280px',
    padding: '0 1rem',
    margin: '0 auto',
  },
  
  grid: {
    gap: {
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
    },
    columns: {
      mobile: 1,
      tablet: 2,
      desktop: 3,
      wide: 4,
    }
  },

  spacing: {
    section: '4rem',
    component: '1.5rem',
    element: '0.75rem',
  }
};

/**
 * Accessibility Standards
 */
export const accessibilityStandards = {
  focusRing: 'focus:ring-2 focus:ring-green-500 focus:ring-offset-2',
  colorContrast: {
    minimum: 4.5,
    enhanced: 7,
  },
  touchTarget: {
    minimum: '44px',
    recommended: '48px',
  }
};

/**
 * Animation Presets
 */
export const animationPresets = {
  fadeIn: 'animate-in fade-in duration-300',
  slideUp: 'animate-in slide-in-from-bottom-4 duration-300',
  slideDown: 'animate-in slide-in-from-top-4 duration-300',
  scaleIn: 'animate-in zoom-in-95 duration-200',
  bounce: 'animate-bounce',
  pulse: 'animate-pulse',
  spin: 'animate-spin',
};

/**
 * Utility Functions
 */
export const designUtils = {
  /**
   * Generate consistent spacing classes
   */
  spacing: (size: keyof typeof designSystem.spacing) => {
    return `p-${size}`;
  },

  /**
   * Generate responsive grid classes
   */
  responsiveGrid: (columns: number) => {
    return `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-${Math.min(columns, 3)} lg:grid-cols-${columns}`;
  },

  /**
   * Generate consistent card classes
   */
  cardClasses: (variant: 'default' | 'hover' | 'interactive' = 'default') => {
    const base = componentVariants.card.base;
    const variantClass = componentVariants.card[variant];
    return `${base} ${variantClass}`;
  },

  /**
   * Generate consistent button classes
   */
  buttonClasses: (variant: keyof typeof componentVariants.button.variant, size: keyof typeof componentVariants.button.size) => {
    return `${componentVariants.button.variant[variant]} ${componentVariants.button.size[size]}`;
  }
};

/**
 * Theme Configuration
 */
export const themeConfig = {
  light: {
    background: '#ffffff',
    foreground: '#0f172a',
    muted: '#f1f5f9',
    border: '#e2e8f0',
  },
  dark: {
    background: '#0f172a',
    foreground: '#f8fafc',
    muted: '#1e293b',
    border: '#334155',
  }
};

export default designSystem;
