import { cp } from 'fs/promises'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const siteRoot = join(__dirname, '..')

async function copyStaticAssets() {
  try {
    console.log('Copying static assets for Next.js standalone build...')

    // Copy public directory to .next/standalone/
    const publicSrc = join(siteRoot, 'public')
    const publicDest = join(siteRoot, '.next', 'standalone', 'public')
    await cp(publicSrc, publicDest, { recursive: true })
    console.log('✓ Copied public directory')

    // Copy .next/static to .next/standalone/.next/static
    const staticSrc = join(siteRoot, '.next', 'static')
    const staticDest = join(siteRoot, '.next', 'standalone', '.next', 'static')
    await cp(staticSrc, staticDest, { recursive: true })
    console.log('✓ Copied .next/static directory')

    console.log('Static assets copied successfully!')
  } catch (error) {
    console.error('Error copying static assets:', error)
    process.exit(1)
  }
}

copyStaticAssets()
