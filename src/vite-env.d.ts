/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PAYPAL_CLIENT_ID?: string
}

declare module 'virtual:gallery-assets' {
  const assets: Array<{
    src: string
    mobileSrc: string
    path: string
    folder: string
    type: 'image' | 'video'
    width: number
    height: number
    orientation: 'portrait' | 'landscape' | 'square'
  }>
  export default assets
}
