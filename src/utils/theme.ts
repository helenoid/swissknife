import { getGlobalConfig } from './config'

export interface Theme {
  bashBorder: string
  claude: string
  permission: string
  secondaryBorder: string
  text: string
  secondaryText: string
  suggestion: string
  // Semantic colors
  success: string
  error: string
  warning: string
  diff: {
    added: string
    removed: string
    addedDimmed: string
    removedDimmed: string
  }
}

const lightTheme: Theme = {
  bashBorder: '#E20612', // Swiss Army Knife red
  claude: '#5f97cd',
  permission: '#E20612', // Swiss Army Knife red
  secondaryBorder: '#999',
  text: '#000',
  secondaryText: '#666',
  suggestion: '#E20612', // Swiss Army Knife red
  success: '#2c7a39',
  error: '#E20612', // Swiss Army Knife red
  warning: '#966c1e',
  diff: {
    added: '#69db7c',
    removed: '#ffa8b4',
    addedDimmed: '#c7e1cb',
    removedDimmed: '#fdd2d8',
  },
}

const lightDaltonizedTheme: Theme = {
  bashBorder: '#0066cc', // Blue instead of pink for better contrast
  claude: '#5f97cd', // Orange adjusted for deuteranopia
  permission: '#3366ff', // Brighter blue for better visibility
  secondaryBorder: '#999',
  text: '#000',
  secondaryText: '#666',
  suggestion: '#3366ff',
  success: '#006699', // Blue instead of green
  error: '#cc0000', // Pure red for better distinction
  warning: '#ff9900', // Orange adjusted for deuteranopia
  diff: {
    added: '#99ccff', // Light blue instead of green
    removed: '#ffcccc', // Light red for better contrast
    addedDimmed: '#d1e7fd',
    removedDimmed: '#ffe9e9',
  },
}

const darkTheme: Theme = {
  bashBorder: '#FF0A15', // Brighter Swiss Army Knife red for dark theme
  claude: '#5f97cd',
  permission: '#FF0A15', // Brighter Swiss Army Knife red for dark theme
  secondaryBorder: '#888',
  text: '#fff',
  secondaryText: '#999',
  suggestion: '#FF0A15', // Brighter Swiss Army Knife red for dark theme
  success: '#4eba65',
  error: '#FF0A15', // Brighter Swiss Army Knife red for dark theme
  warning: '#ffc107',
  diff: {
    added: '#225c2b',
    removed: '#7a2936',
    addedDimmed: '#47584a',
    removedDimmed: '#69484d',
  },
}

const darkDaltonizedTheme: Theme = {
  bashBorder: '#3399ff', // Bright blue instead of pink
  claude: '#5f97cd', // Orange adjusted for deuteranopia
  permission: '#99ccff', // Light blue for better contrast
  secondaryBorder: '#888',
  text: '#fff',
  secondaryText: '#999',
  suggestion: '#99ccff',
  success: '#3399ff', // Bright blue instead of green
  error: '#ff6666', // Bright red for better visibility
  warning: '#ffcc00', // Yellow-orange for deuteranopia
  diff: {
    added: '#004466', // Dark blue instead of green
    removed: '#660000', // Dark red for better contrast
    addedDimmed: '#3e515b',
    removedDimmed: '#3e2c2c',
  },
}

export type ThemeNames =
  | 'dark'
  | 'light'
  | 'light-daltonized'
  | 'dark-daltonized'

export function getTheme(overrideTheme?: ThemeNames): Theme {
  const config = getGlobalConfig()
  switch (overrideTheme ?? config.theme) {
    case 'light':
      return lightTheme
    case 'light-daltonized':
      return lightDaltonizedTheme
    case 'dark-daltonized':
      return darkDaltonizedTheme
    default:
      return darkTheme
  }
}
