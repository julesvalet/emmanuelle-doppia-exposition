/// <reference types="vite/client" />

declare module 'virtual:gallery-assets' {
  const assets: Array<{
    src: string
    mobileSrc: string
    path: string
    folder: string
    type: 'image' | 'video'
    title: string
    width: number
    height: number
    orientation: 'portrait' | 'landscape' | 'square'
  }>
  export default assets
}
