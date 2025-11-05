/**
 * Accessibility utilities for better user experience
 */

export const accessibilityUtils = {
  /**
   * Generate ARIA labels for common actions
   */
  generateAriaLabel: (action: string, context?: string) => {
    const baseLabels: Record<string, string> = {
      'add-to-cart': 'Add item to shopping cart',
      'remove-from-cart': 'Remove item from shopping cart',
      'view-details': 'View item details',
      'download': 'Download file',
      'search': 'Search for items',
      'filter': 'Filter results',
      'sort': 'Sort results',
      'close': 'Close dialog',
      'open': 'Open dialog',
      'next': 'Go to next page',
      'previous': 'Go to previous page',
      'submit': 'Submit form',
      'cancel': 'Cancel action',
    };

    const label = baseLabels[action] || action;
    return context ? `${label} - ${context}` : label;
  },

  /**
   * Generate ARIA descriptions for complex interactions
   */
  generateAriaDescription: (element: string, context?: string) => {
    const descriptions: Record<string, string> = {
      'product-card': 'Product card with image, title, price and action buttons',
      'service-card': 'Service card with image, title, pricing and action buttons',
      'search-input': 'Search input field for finding products and services',
      'filter-dropdown': 'Filter dropdown for narrowing search results',
      'pagination': 'Pagination controls for navigating through results',
      'image-gallery': 'Image gallery with navigation controls',
      'message-input': 'Message input field for typing messages',
      'file-upload': 'File upload area for attaching files to messages',
    };

    return descriptions[element] || `${element} interactive element`;
  },

  /**
   * Generate keyboard navigation hints
   */
  generateKeyboardHints: (element: string) => {
    const hints: Record<string, string> = {
      'button': 'Press Enter or Space to activate',
      'link': 'Press Enter to navigate',
      'input': 'Type to enter text, Tab to move to next field',
      'dropdown': 'Press Enter to open, Arrow keys to navigate, Escape to close',
      'modal': 'Press Escape to close, Tab to navigate between elements',
      'card': 'Press Enter to view details',
      'slider': 'Use Arrow keys to adjust value',
    };

    return hints[element] || 'Use keyboard to interact';
  },

  /**
   * Check if element should be focusable
   */
  shouldBeFocusable: (element: string, disabled?: boolean) => {
    if (disabled) return false;
    
    const focusableElements = [
      'button', 'link', 'input', 'select', 'textarea', 
      'card', 'modal', 'dropdown', 'slider'
    ];
    
    return focusableElements.includes(element);
  },

  /**
   * Generate screen reader announcements
   */
  announceToScreenReader: (message: string) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  },

  /**
   * Generate focus management utilities
   */
  focusManagement: {
    trapFocus: (element: HTMLElement) => {
      const focusableElements = element.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
      
      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              lastElement.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === lastElement) {
              firstElement.focus();
              e.preventDefault();
            }
          }
        }
      };
      
      element.addEventListener('keydown', handleTabKey);
      firstElement?.focus();
      
      return () => element.removeEventListener('keydown', handleTabKey);
    },
    
    restoreFocus: (element: HTMLElement) => {
      element.focus();
    }
  }
};

/**
 * Custom hook for accessibility features
 */
export const useAccessibility = () => {
  const announce = (message: string) => {
    accessibilityUtils.announceToScreenReader(message);
  };

  const generateLabel = (action: string, context?: string) => {
    return accessibilityUtils.generateAriaLabel(action, context);
  };

  const generateDescription = (element: string, context?: string) => {
    return accessibilityUtils.generateAriaDescription(element, context);
  };

  return {
    announce,
    generateLabel,
    generateDescription,
    focusManagement: accessibilityUtils.focusManagement,
  };
};
