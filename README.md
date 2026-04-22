# vitepress-headup

`vitepress-headup` adds a small, theme-aware HUD to the VitePress navbar. It can show package version, git commit, branch, content update time, and a polished detail popover.

It is intentionally defensive: if VitePress changes a navbar selector, the component falls back to the nearest available navbar area instead of crashing the site.

## Install

```sh
npm install git+ssh://git@github.com:tangxiaoyi97/vitepress-headup.git
```

## VitePress config

```ts
// .vitepress/config.mts
import { defineConfig } from 'vitepress'
import { headupPlugin } from 'vitepress-headup/plugin'

export default defineConfig({
  vite: {
    plugins: [
      headupPlugin({
        hud: {
          enabled: true,
          label: 'v{version}',
          title: '{name} {version} · {commit}'
        },
        detail: {
          enabled: true,
          title: 'Archive status'
        }
      })
    ]
  }
})
```

## Theme setup

```ts
// .vitepress/theme/index.ts
import { h } from 'vue'
import DefaultTheme from 'vitepress/theme'
import { Headup } from 'vitepress-headup'
import 'vitepress-headup/style.css'

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'layout-bottom': () => h(Headup)
    })
  }
}
```

The HUD is inserted before the VitePress appearance switch when possible. The detail icon is inserted near social links when possible.

## Options

```ts
headupPlugin({
  enabled: true,
  hud: {
    enabled: true,
    label: 'v{version}',
    title: '{name} {version}',
    showDirty: true
  },
  detail: {
    enabled: true,
    title: 'Site information',
    iconLabel: 'Open site information'
  },
  target: {
    hud: 'auto',
    detail: 'auto'
  },
  style: {
    accentColor: '',
    pillClass: '',
    iconClass: '',
    modalClass: ''
  },
  git: {
    enabled: true,
    remote: true
  },
  lastUpdated: {
    enabled: true,
    include: ['.'],
    extensions: ['.md', '.vue', '.ts', '.js', '.json'],
    exclude: ['.git', 'node_modules', '.vitepress/cache', '.vitepress/dist']
  },
  custom: {
    channel: 'library'
  }
})
```

Set `target.hud` or `target.detail` to a CSS selector when a custom theme needs a precise insertion point. The default `auto` tries VitePress navbar selectors in a safe fallback order.

## Label templates

HUD labels can use:

- `{name}`
- `{version}`
- `{branch}`
- `{commit}`
- `{fullCommit}`
- `{tag}`

Example:

```ts
headupPlugin({
  hud: {
    label: '{branch}@{commit}'
  }
})
```

## Runtime override

```ts
h(Headup, {
  config: {
    hud: { enabled: false },
    detail: { enabled: true }
  }
})
```
