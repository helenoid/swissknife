// Desktop App Utility for SwissKnife Virtual Desktop
export interface DesktopAppConfig {
  id: string
  title: string
  icon: string
  width?: number
  height?: number
  x?: number
  y?: number
  resizable?: boolean
  minimizable?: boolean
  maximizable?: boolean
  content: () => string
  onMount?: (container: HTMLElement) => void
  onUnmount?: () => void
}

export function createDesktopApp(config: DesktopAppConfig) {
  return {
    ...config,
    width: config.width || 600,
    height: config.height || 400,
    resizable: config.resizable !== false,
    minimizable: config.minimizable !== false,
    maximizable: config.maximizable !== false
  }
}

export function registerDesktopApp(app: ReturnType<typeof createDesktopApp>) {
  // Register app with the desktop system
  if (typeof window !== 'undefined' && (window as any).desktop) {
    (window as any).desktop.registerApp(app)
  }
}