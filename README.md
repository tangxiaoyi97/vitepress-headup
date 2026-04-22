# vitepress-headup

`vitepress-headup` adds a small, theme-aware head-up text to the VitePress navbar. It can show the current git commit, branch, package version, content update time, and a polished detail popover.

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
          label: '{commit}',
          title: 'Git commit {commit}'
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
import DefaultTheme from 'vitepress/theme'
import { withHeadup } from 'vitepress-headup'
import 'vitepress-headup/style.css'

export default withHeadup({
  extends: DefaultTheme
})
```

The HUD is inserted inside the native VitePress appearance area when possible, so default navbar separators stay intact. The detail icon is inserted inside the native social-links area and copies VitePress social-link dimensions and hover behavior. The default HUD label is `{commit}` and renders nothing if no git commit is available.

## Options

```ts
headupPlugin({
  enabled: true,
  hud: {
    enabled: true,
    label: '{commit}',
    title: '{name} {version} · {branch}@{commit}',
    showDirty: false
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

When the resolved HUD label is empty, the navbar text is not rendered. This keeps sites without git metadata visually clean.

## Runtime override

```ts
h(Headup, {
  config: {
    hud: { enabled: false },
    detail: { enabled: true }
  }
})
```
