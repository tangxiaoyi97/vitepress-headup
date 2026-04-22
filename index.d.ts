import type { Theme } from 'vitepress'
import type { Component } from 'vue'

export interface HeadupRuntimeConfig {
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
  locale?: string
  fallback?: string
}

export declare const Headup: Component
export declare function withHeadup(theme: Theme, config?: HeadupRuntimeConfig): Theme
export default Headup
