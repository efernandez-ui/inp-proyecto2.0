import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { extname, join, relative as relativePath, sep } from 'node:path'

const basePath = process.env.GITHUB_PAGES_BASE_PATH?.replace(/\/+$/, '')
if (!basePath || !basePath.startsWith('/')) {
  throw new Error('GITHUB_PAGES_BASE_PATH must be an absolute URL path')
}

const publicDirectory = join(process.cwd(), 'public')
const outputDirectory = join(process.cwd(), 'out')
const textExtensions = new Set(['.css', '.html', '.js', '.json', '.txt', '.xml'])

function listFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? listFiles(path) : [path]
  })
}

const assetPaths = listFiles(publicDirectory)
  .map((path) => `/${relativePath(publicDirectory, path).split(sep).join('/')}`)
  .sort((left, right) => right.length - left.length)

if (assetPaths.length === 0) {
  throw new Error('No public assets were found to prefix')
}

const escapedAssetPaths = assetPaths.map((path) =>
  path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
)
const assetPattern = new RegExp(
  `(^|[^A-Za-z0-9_./-])(${escapedAssetPaths.join('|')})(?=$|[^A-Za-z0-9_.-])`,
  'g',
)

let replacements = 0
for (const path of listFiles(outputDirectory)) {
  if (!textExtensions.has(extname(path))) continue

  const contents = readFileSync(path, 'utf8')
  const updated = contents.replace(assetPattern, (_match, boundary, assetPath) => {
    replacements += 1
    return `${boundary}${basePath}${assetPath}`
  })

  if (updated !== contents) writeFileSync(path, updated)
}

if (replacements === 0) {
  throw new Error('No public asset references were found in the exported site')
}

console.log(`Prefixed ${replacements} public asset references with ${basePath}`)
