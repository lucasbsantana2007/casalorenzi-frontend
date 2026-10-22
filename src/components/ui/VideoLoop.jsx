import { useEffect, useState } from 'react'

const MENOS_MOVIMENTO = '(prefers-reduced-motion: reduce)'

// Vídeo de fundo em loop (sem som), com a capa enquanto carrega. Quem pede menos movimento no
// sistema vê só a capa parada. Arquivos em public/videos (Pexels, licença livre; tratados com ffmpeg:
// loop sem emenda, sem áudio, 1280 px).
export function VideoLoop({ nome, className = '' }) {
  const [parado, setParado] = useState(() => window.matchMedia(MENOS_MOVIMENTO).matches)
  useEffect(() => {
    const mq = window.matchMedia(MENOS_MOVIMENTO)
    const sincronizar = () => setParado(mq.matches)
    mq.addEventListener('change', sincronizar)
    return () => mq.removeEventListener('change', sincronizar)
  }, [])
  const capa = `/videos/${nome}.jpg`
  return (
    <div className={`video-loop ${className}`} aria-hidden="true">
      {parado ? (
        <img src={capa} alt="" />
      ) : (
        <video src={`/videos/${nome}.mp4`} poster={capa} autoPlay muted loop playsInline preload="metadata" />
      )}
    </div>
  )
}
