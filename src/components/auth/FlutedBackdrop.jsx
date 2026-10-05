import { FlutedGlass } from '@paper-design/shaders-react'

// Efeito de vidro canelado (shader WebGL) usado sobre o azul-marinho da marca.
export function FlutedBackdrop() {
  return (
    <div className="fluted-backdrop" aria-hidden="true">
      <FlutedGlass
        size={0.89}
        shape="lines"
        angle={0}
        distortionShape="prism"
        distortion={0.5}
        shift={0}
        blur={0}
        edges={0.25}
        stretch={0}
        scale={1.11}
        fit="cover"
        highlights={0.1}
        shadows={0.2}
        grainMixer={0.1}
        grainOverlay={0.1}
        colorBack="#00000000"
        colorHighlight="#FFFFFF"
        colorShadow="#000000"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )
}
