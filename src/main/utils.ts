import fs from 'node:fs/promises'
import path from 'node:path'

export async function getThemeList(dir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dir)
    return entries
      .filter(entry => entry.slice(-3).toLowerCase() === 'css')
      .sort()
      .map(entry => entry.slice(0, -4))
  } catch (err) {
    console.warn('Error reading directory:', err)
    throw err
  }
}

export async function copyThemes(srcDir: string, destDir: string, themes: string[], overwrite: boolean): Promise<void> {
  try {
    // Create "Themes" directory if it doesn't exist
    await fs.mkdir(destDir, { recursive: true })

    // Iterate over each theme
    for (const themeName of themes) {
      const srcFilePath = path.join(srcDir, `${themeName}.css`)
      const destFilePath = path.join(destDir, `${themeName}.css`)

      try {
        await fs.access(destFilePath)
        // File already exists: ${destFilePath}
        if (overwrite) throw new Error()
      } catch {
        await fs.copyFile(srcFilePath, destFilePath)
        // Copied file from ${srcFilePath} to ${destFilePath}
      }
    }
  } catch (err) {
    console.warn('Error during copying directories and files:', err)
    throw err
  }
}

export async function readThemeStyles(themeFile: string): Promise<string> {
  let styles = ''

  try {
    styles = await fs.readFile(themeFile, 'utf8')
  } catch (err) {
    console.warn('Error reading file:', err)
  }

  return styles
}
