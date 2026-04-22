import { Teleport, computed, defineComponent, h, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import generated from 'virtual:vitepress-headup/data'

const INFO_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12.713 16.713Q13 16.425 13 16v-4q0-.425-.288-.712T12 11t-.712.288T11 12v4q0 .425.288.713T12 17t.713-.288m0-8Q13 8.425 13 8t-.288-.712T12 7t-.712.288T11 8t.288.713T12 9t.713-.288M12 22q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22"/></svg>'

const DEFAULT_RUNTIME = {
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
  locale: undefined,
  fallback: 'unknown'
}

function isObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value)
}

function mergeDeep(base, override) {
  const out = { ...base }
  if (!isObject(override)) return out
  for (const [key, value] of Object.entries(override)) {
    if (isObject(value) && isObject(base[key])) out[key] = mergeDeep(base[key], value)
    else out[key] = value
  }
  return out
}

function formatDate(value, locale) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  try {
    return new Intl.DateTimeFormat(locale || undefined, {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date)
  } catch {
    return date.toISOString()
  }
}

function template(text, data, fallback) {
  return String(text || '').replace(/\{([^}]+)\}/g, (_, key) => {
    const path = key.trim().split('.')
    let current = data
    for (const segment of path) current = current?.[segment]
    return current == null || current === '' ? fallback : String(current)
  })
}

function getData(runtime) {
  const fallback = runtime.fallback || 'unknown'
  return {
    name: generated.site?.name || fallback,
    version: generated.site?.version || fallback,
    description: generated.site?.description || '',
    branch: generated.git?.branch || fallback,
    commit: generated.git?.shortCommit || generated.git?.commit || fallback,
    fullCommit: generated.git?.commit || fallback,
    tag: generated.git?.tag || '',
    remote: generated.git?.remote || '',
    dirty: Boolean(generated.git?.dirty),
    lastCommitDate: generated.git?.lastCommitDate || '',
    lastUpdated: generated.lastUpdated || '',
    generatedAt: generated.generatedAt || ''
  }
}

function ensureAnchor(id, mode) {
  if (typeof document === 'undefined') return false
  let anchor = document.getElementById(id)
  if (!anchor) {
    anchor = document.createElement('span')
    anchor.id = id
    anchor.className = 'vp-headup-anchor'
  }

  if (anchor.isConnected) return true

  const appearance = document.querySelector('.VPNavBarAppearance')
  const social = document.querySelector('.VPSocialLinks, .VPNavBarSocialLinks')
  const extra = document.querySelector('.VPNavBarExtra')
  const contentBody = document.querySelector('.VPNavBar .content-body, .VPNavBar .content')

  if (mode === 'detail') {
    const target = social || appearance || extra || contentBody
    if (target?.parentElement) {
      target.parentElement.insertBefore(anchor, target.nextSibling)
      return true
    }
  } else {
    if (appearance?.parentElement) {
      appearance.parentElement.insertBefore(anchor, appearance)
      return true
    }
    const target = extra || social || contentBody
    if (target?.parentElement) {
      target.parentElement.insertBefore(anchor, target)
      return true
    }
  }

  return false
}

function row(label, value) {
  if (!value) return null
  return h('div', { class: 'vp-headup-row' }, [
    h('span', { class: 'vp-headup-row-label' }, label),
    h('span', { class: 'vp-headup-row-value' }, value)
  ])
}

export const Headup = defineComponent({
  name: 'VitePressHeadup',
  props: {
    config: {
      type: Object,
      default: () => ({})
    }
  },
  setup(props) {
    const runtime = computed(() => mergeDeep(mergeDeep(DEFAULT_RUNTIME, generated.options || {}), props.config || {}))
    const readyHud = ref(false)
    const readyDetail = ref(false)
    const open = ref(false)
    const data = computed(() => getData(runtime.value))
    let observer
    let tries = 0

    function syncAnchors() {
      if (!runtime.value.enabled) return
      if (runtime.value.hud?.enabled) readyHud.value = ensureAnchor('vp-headup-hud-anchor', 'hud')
      if (runtime.value.detail?.enabled) readyDetail.value = ensureAnchor('vp-headup-detail-anchor', 'detail')
      tries += 1
    }

    function onKeydown(event) {
      if (event.key === 'Escape') open.value = false
    }

    onMounted(() => {
      nextTick(syncAnchors)
      const interval = window.setInterval(() => {
        syncAnchors()
        if ((readyHud.value || !runtime.value.hud?.enabled) && (readyDetail.value || !runtime.value.detail?.enabled)) {
          window.clearInterval(interval)
        }
        if (tries > 40) window.clearInterval(interval)
      }, 120)

      observer = new MutationObserver(() => syncAnchors())
      observer.observe(document.body, { childList: true, subtree: true })
      window.addEventListener('keydown', onKeydown)
    })

    onBeforeUnmount(() => {
      observer?.disconnect()
      window.removeEventListener('keydown', onKeydown)
    })

    const hudNode = () => {
      const label = template(runtime.value.hud?.label || 'v{version}', data.value, runtime.value.fallback)
      const title = template(runtime.value.hud?.title || '{name} {version}', data.value, runtime.value.fallback)
      const dirty = data.value.dirty && runtime.value.hud?.showDirty
      return h('button', {
        class: ['vp-headup-pill', dirty ? 'is-dirty' : ''],
        type: 'button',
        title,
        onClick: () => {
          if (runtime.value.detail?.enabled) open.value = true
        }
      }, [
        h('span', { class: 'vp-headup-dot' }),
        h('span', { class: 'vp-headup-label' }, label),
        dirty ? h('span', { class: 'vp-headup-dirty', title: 'Working tree has local changes' }, '*') : null
      ])
    }

    const detailButton = () => h('button', {
      class: 'vp-headup-icon',
      type: 'button',
      title: runtime.value.detail?.iconLabel || 'Open site information',
      'aria-label': runtime.value.detail?.iconLabel || 'Open site information',
      innerHTML: INFO_ICON,
      onClick: () => { open.value = true }
    })

    const modal = () => open.value
      ? h(Teleport, { to: 'body' }, [
        h('div', { class: 'vp-headup-backdrop', onClick: () => { open.value = false } }),
        h('section', {
          class: 'vp-headup-modal',
          role: 'dialog',
          'aria-modal': 'true',
          'aria-label': runtime.value.detail?.title || 'Site information'
        }, [
          h('header', { class: 'vp-headup-modal-header' }, [
            h('div', [
              h('p', { class: 'vp-headup-kicker' }, 'Headup'),
              h('h2', runtime.value.detail?.title || 'Site information')
            ]),
            h('button', {
              class: 'vp-headup-close',
              type: 'button',
              'aria-label': 'Close',
              onClick: () => { open.value = false }
            }, '×')
          ]),
          h('div', { class: 'vp-headup-grid' }, [
            row('Project', data.value.name),
            row('Version', data.value.version),
            row('Branch', data.value.branch),
            row('Commit', data.value.commit),
            row('Tag', data.value.tag),
            row('Last commit', formatDate(data.value.lastCommitDate, runtime.value.locale)),
            row('Content updated', formatDate(data.value.lastUpdated, runtime.value.locale)),
            row('Generated', formatDate(data.value.generatedAt, runtime.value.locale)),
            row('Remote', data.value.remote)
          ]),
          generated.custom && Object.keys(generated.custom).length
            ? h('pre', { class: 'vp-headup-custom' }, JSON.stringify(generated.custom, null, 2))
            : null
        ])
      ])
      : null

    return () => {
      if (!runtime.value.enabled) return null
      return [
        readyHud.value && runtime.value.hud?.enabled
          ? h(Teleport, { to: '#vp-headup-hud-anchor' }, hudNode())
          : null,
        readyDetail.value && runtime.value.detail?.enabled
          ? h(Teleport, { to: '#vp-headup-detail-anchor' }, detailButton())
          : null,
        modal()
      ]
    }
  }
})

export function withHeadup(theme, config = {}) {
  const base = theme || {}
  const BaseLayout = base.Layout || base.extends?.Layout
  return {
    ...base,
    Layout() {
      return BaseLayout
        ? h(BaseLayout, null, { 'layout-bottom': () => h(Headup, { config }) })
        : h(Headup, { config })
    }
  }
}

export default Headup
