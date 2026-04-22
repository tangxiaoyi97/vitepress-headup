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
  target?: {
    hud?: string
    detail?: string
  }
  style?: {
    accentColor?: string
    pillClass?: string
    iconClass?: string
    modalClass?: string
  }
  locale?: string
  fallback?: string
}

export declare const Headup: Component
export declare function withHeadup(theme: Theme, config?: HeadupRuntimeConfig): Theme
export default Headup
