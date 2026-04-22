import type { Plugin } from 'vite'

export interface HeadupPluginOptions {
  enabled?: boolean
  hud?: {
    enabled?: boolean
    label?: string
    title?: string
    showDirty?: boolean
  }
  detail?: {
    enabled?: boolean
    title?: string
    iconLabel?: string
  }
  git?: {
    enabled?: boolean
    remote?: boolean
  }
  lastUpdated?: {
    enabled?: boolean
    include?: string[]
    extensions?: string[]
    exclude?: string[]
  }
  packageJson?: string
  locale?: string
  fallback?: string
  custom?: Record<string, unknown>
}

export declare function headupPlugin(options?: HeadupPluginOptions): Plugin
export default headupPlugin
