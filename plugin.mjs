import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const VIRTUAL_ID = 'virtual:vitepress-headup/data'
const RESOLVED_VIRTUAL_ID = '\0' + VIRTUAL_ID

const DEFAULT_OPTIONS = {
  enabled: true,
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
  hud: {
    enabled: true,
    label: 'v{version}',
    title: '{name} {version}',
    showDirty: true
  },
  git: {
    enabled: true,
    remote: true
  },
  lastUpdated: {
    enabled: true,
    include: ['.'],
    extensions: ['.md', '.mdx', '.vue', '.ts', '.tsx', '.js', '.jsx', '.json', '.mts', '.mjs', '.css'],
    exclude: ['.git', 'node_modules', '.vitepress/cache', '.vitepress/dist', 'dist', 'build']
  },
  packageJson: 'package.json',
  locale: undefined,
  fallback: 'unknown',
  custom: {}
}

function mergeDeep(base, override) {
  if (!override || typeof override !== 'object') return { ...base }
  const out = { ...base }
  for (const [key, value] of Object.entries(override)) {
    if (value && typeof value === 'object' && !Array.isArray(value) && base[key] && typeof base[key] === 'object' && !Array.isArray(base[key])) {
      out[key] = mergeDeep(base[key], value)
    } else {
      out[key] = value
    }
  }
  return out
}

function safeExec(command, cwd) {
  try {
    return execSync(command, {
      cwd,
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf8'
    }).trim()
  } catch {
    return ''
  }
}

function readPackage(cwd, packageJson) {
  const file = path.resolve(cwd, packageJson || 'package.json')
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return {}
  }
}

function toUnixPath(value) {
  return value.split(path.sep).join('/')
}

function shouldSkip(fullPath, relPath, exclude) {
  const rel = toUnixPath(relPath)
  const segments = rel.split('/')
  return exclude.some((item) => {
    const normalized = item.replace(/\\/g, '/').replace(/\/+$/, '')
    return rel === normalized || rel.startsWith(normalized + '/') || segments.includes(normalized)
  })
}

function scanLatestMtime(root, options) {
  if (!options.enabled) return null
  const include = Array.isArray(options.include) && options.include.length ? options.include : ['.']
  const extensions = new Set(options.extensions || [])
  const exclude = options.exclude || []
  let latest = 0

  function visit(fullPath) {
    let stat
    try {
      stat = fs.statSync(fullPath)
    } catch {
      return
    }

    const relPath = path.relative(root, fullPath) || '.'
    if (shouldSkip(fullPath, relPath, exclude)) return

    if (stat.isDirectory()) {
      let entries = []
      try {
        entries = fs.readdirSync(fullPath)
      } catch {
        return
      }
      for (const entry of entries) visit(path.join(fullPath, entry))
      return
    }

    if (!stat.isFile()) return
    if (extensions.size && !extensions.has(path.extname(fullPath))) return
    latest = Math.max(latest, stat.mtimeMs)
  }

  for (const item of include) visit(path.resolve(root, item))
  return latest ? new Date(latest).toISOString() : null
}

function collectGit(cwd, options) {
  if (!options.enabled) return {}
  const commit = safeExec('git rev-parse HEAD', cwd)
  const shortCommit = safeExec('git rev-parse --short HEAD', cwd)
  const branch = safeExec('git branch --show-current', cwd) || safeExec('git rev-parse --abbrev-ref HEAD', cwd)
  const tag = safeExec('git describe --tags --abbrev=0', cwd)
  const lastCommitDate = safeExec('git log -1 --format=%cI', cwd)
  const dirty = Boolean(safeExec('git status --porcelain', cwd))
  const remote = options.remote ? safeExec('git config --get remote.origin.url', cwd) : ''

  return {
    commit: commit || null,
    shortCommit: shortCommit || null,
    branch: branch || null,
    tag: tag || null,
    lastCommitDate: lastCommitDate || null,
    dirty,
    remote: remote || null
  }
}

function createData(root, rawOptions) {
  const options = mergeDeep(DEFAULT_OPTIONS, rawOptions)
  const pkg = readPackage(root, options.packageJson)
  const git = collectGit(root, options.git)
  const lastUpdated = scanLatestMtime(root, options.lastUpdated)
  const generatedAt = new Date().toISOString()

  return {
    options,
    site: {
      name: pkg.name || options.custom.name || 'vitepress-site',
      version: pkg.version || options.custom.version || '0.0.0',
      description: pkg.description || ''
    },
    git,
    lastUpdated,
    generatedAt,
    custom: options.custom || {}
  }
}

export function headupPlugin(options = {}) {
  let root = process.cwd()
  let payload = null

  return {
    name: 'vitepress-headup',
    enforce: 'pre',
    config() {
      return {
        optimizeDeps: {
          exclude: ['vitepress-headup']
        },
        ssr: {
          noExternal: ['vitepress-headup']
        }
      }
    },
    configResolved(config) {
      root = config.root || process.cwd()
      payload = createData(root, options)
    },
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_VIRTUAL_ID
      return null
    },
    load(id) {
      if (id !== RESOLVED_VIRTUAL_ID) return null
      if (!payload) payload = createData(root, options)
      return `export default ${JSON.stringify(payload, null, 2)}`
    },
    handleHotUpdate(ctx) {
      const rel = toUnixPath(path.relative(root, ctx.file))
      if (rel === 'package.json' || rel.startsWith('.git/') || rel.endsWith('.md') || rel.includes('.vitepress/config')) {
        payload = createData(root, options)
      }
    }
  }
}

export default headupPlugin
