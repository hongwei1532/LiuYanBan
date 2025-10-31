import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  saveConfig: (cfg) => ipcRenderer.invoke('setup:save-config', cfg)
})