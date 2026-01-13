// FieldLink Enhanced Theme - Industrial Precision
// Inspired by high-end diagnostic equipment and HVAC craftsmanship

export const theme = {
  colors: {
    // Base colors - Deep industrial palette
    background: {
      primary: '#0D1117',      // Deep space
      secondary: '#161B22',    // Charcoal
      tertiary: '#21262D',     // Slate
      elevated: '#30363D',     // Lifted surface
    },

    // Accent colors - Copper/Amber (HVAC craft)
    accent: {
      primary: '#E67E22',      // Copper
      secondary: '#F39C12',    // Amber/Gold
      tertiary: '#D35400',     // Deep copper
      glow: 'rgba(230, 126, 34, 0.3)',
    },

    // Secondary accent - Teal (diagnostic/technical)
    teal: {
      primary: '#14B8A6',
      secondary: '#0D9488',
      glow: 'rgba(20, 184, 166, 0.3)',
    },

    // Status colors
    status: {
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
    },

    // Text colors
    text: {
      primary: '#F0F6FC',
      secondary: '#8B949E',
      tertiary: '#6E7681',
      accent: '#E67E22',
    },

    // Border colors
    border: {
      primary: 'rgba(240, 246, 252, 0.1)',
      secondary: 'rgba(240, 246, 252, 0.05)',
      accent: 'rgba(230, 126, 34, 0.3)',
    },
  },

  fonts: {
    display: '"Plus Jakarta Sans", sans-serif',
    body: '"Plus Jakarta Sans", sans-serif',
    mono: '"JetBrains Mono", monospace',
  },

  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px rgba(0, 0, 0, 0.4)',
    lg: '0 10px 25px rgba(0, 0, 0, 0.5)',
    xl: '0 20px 50px rgba(0, 0, 0, 0.6)',
    glow: {
      copper: '0 0 30px rgba(230, 126, 34, 0.4)',
      teal: '0 0 30px rgba(20, 184, 166, 0.4)',
    },
  },

  gradients: {
    copper: 'linear-gradient(135deg, #E67E22 0%, #D35400 100%)',
    copperSubtle: 'linear-gradient(135deg, rgba(230, 126, 34, 0.2) 0%, rgba(211, 84, 0, 0.1) 100%)',
    teal: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
    dark: 'linear-gradient(180deg, #161B22 0%, #0D1117 100%)',
    glass: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
  },

  blur: {
    sm: 'blur(4px)',
    md: 'blur(8px)',
    lg: 'blur(16px)',
    xl: 'blur(24px)',
  },
}

// CSS Variables for easy usage in Tailwind
export const cssVariables = `
  :root {
    --color-bg-primary: ${theme.colors.background.primary};
    --color-bg-secondary: ${theme.colors.background.secondary};
    --color-bg-tertiary: ${theme.colors.background.tertiary};
    --color-bg-elevated: ${theme.colors.background.elevated};

    --color-accent: ${theme.colors.accent.primary};
    --color-accent-secondary: ${theme.colors.accent.secondary};
    --color-accent-glow: ${theme.colors.accent.glow};

    --color-teal: ${theme.colors.teal.primary};
    --color-teal-glow: ${theme.colors.teal.glow};

    --color-text-primary: ${theme.colors.text.primary};
    --color-text-secondary: ${theme.colors.text.secondary};

    --font-display: ${theme.fonts.display};
    --font-body: ${theme.fonts.body};
    --font-mono: ${theme.fonts.mono};
  }
`
