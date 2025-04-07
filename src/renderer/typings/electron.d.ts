/**
 * Should match main/preload.ts for typescript support in renderer
 */
import { IpcRendererEvent } from 'electron'

export default interface ElectronApi {
  isMac: () => boolean
  updateAppState: (payload: object) => void
  setSpellChecker: (enable: boolean) => void

  showWindow: (color: string) => void
  closeWindow: () => void
  setWindowTitle: (title: string) => void
  zoomWindow: (factor: number) => void
  quitApp: () => void
  isFullScreen: () => Promise<boolean>
  toggleFullScreen: () => void
  handleRequestCloseWindow: (callback: (event: IpcRendererEvent) => void) => void

  getConfig: (key: string) => Promise<unknown>
  setConfig: (key: string, value: unknown) => Promise<unknown>

  openFolder: (fullPath: string) => void
  openUrl: (url: string) => void

  getFilePathFromUrl: (fileUrl: string) => Promise<string>
  getFileNameFromPath: (filePath: string) => Promise<string>
  readFile: (filePath: string, password: string) => Promise<string>
  writeFile: (filePath: string, oldFilePath: string, data: string, password: string) => Promise<void>
  renameFile: (filePath: string, fileName: string) => Promise<string>
  getThemeStyles: (themeName: string) => Promise<string>
  getThemes: () => Promise<string[]>
  handleAddProjectFiles: (callback: (event: IpcRendererEvent, files: string[], action: string) => void) => void

  openFileDialog: (payload: object) => void
  openImageDialog: () => void
  saveFileDialog: (payload: object) => void
  handleOpenFiles: (callback: (event: IpcRendererEvent, filePaths: string[]) => void) => void
  handleOpenImage: (callback: (event: IpcRendererEvent, image: string) => void) => void
  handleSaveFile: (callback: (event: IpcRendererEvent, filePath: string) => void) => void
}

declare global {
  interface Window {
    electronAPI: ElectronApi
  }
}
