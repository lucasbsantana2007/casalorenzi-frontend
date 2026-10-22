import { useEffect, useState } from 'react'

const BORDA_PX = 8 // mouse encostado na borda de cima
const PUXAO_PX = 40 // no celular, puxar a página para baixo estando no topo

// Faixa das marcas: recolhida enquanto a página está rolada; abre ao chegar ao topo (voltando a rolar
// até ele, girando a rodinha para cima já no topo, puxando a tela no celular ou com o mouse na borda).
export function useBarraNoTopo() {
  const [aberta, setAberta] = useState(false)

  useEffect(() => {
    const noTopo = () => window.scrollY <= 0
    let rolada = !noTopo()
    let inicioToque = null

    const aoRolar = () => {
      if (!noTopo()) {
        rolada = true
        setAberta(false)
      } else if (rolada) {
        rolada = false
        setAberta(true)
      }
    }
    const aoGirar = (e) => noTopo() && e.deltaY < 0 && setAberta(true)
    const aoMoverMouse = (e) => noTopo() && e.clientY <= BORDA_PX && setAberta(true)
    const aoTocar = (e) => {
      inicioToque = noTopo() ? e.touches[0].clientY : null
    }
    const aoArrastar = (e) => inicioToque !== null && e.touches[0].clientY - inicioToque > PUXAO_PX && setAberta(true)

    const opcoes = { passive: true }
    window.addEventListener('scroll', aoRolar, opcoes)
    window.addEventListener('wheel', aoGirar, opcoes)
    window.addEventListener('mousemove', aoMoverMouse, opcoes)
    window.addEventListener('touchstart', aoTocar, opcoes)
    window.addEventListener('touchmove', aoArrastar, opcoes)
    return () => {
      window.removeEventListener('scroll', aoRolar)
      window.removeEventListener('wheel', aoGirar)
      window.removeEventListener('mousemove', aoMoverMouse)
      window.removeEventListener('touchstart', aoTocar)
      window.removeEventListener('touchmove', aoArrastar)
    }
  }, [])

  return aberta
}
