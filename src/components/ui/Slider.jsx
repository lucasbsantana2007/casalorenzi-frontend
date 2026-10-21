import * as SliderPrimitive from '@radix-ui/react-slider'
import { useEffect, useState } from 'react'

// Slider do originui adaptado ao CSS do site: um polegar por valor (dois = faixa) e, com showTooltip, o
// valor aparece acima do polegar enquanto ele é arrastado ou recebe foco pelo teclado. Aceita as props do
// Slider.Root do Radix (value, defaultValue, onValueChange, onValueCommit, min, max, step...).
// thumbLabels nomeia cada polegar para o leitor de tela (o Radix usaria "Minimum" e "Maximum").
export function Slider({ className = '', showTooltip = false, tooltipContent, thumbLabels = [], onValueChange, ...props }) {
  const [interno, setInterno] = useState(props.defaultValue ?? props.value ?? [props.min ?? 0])
  const [arrastando, setArrastando] = useState(false)
  const valores = props.value ?? interno

  useEffect(() => {
    if (!arrastando) return undefined
    const soltar = () => setArrastando(false)
    document.addEventListener('pointerup', soltar)
    document.addEventListener('pointercancel', soltar)
    return () => {
      document.removeEventListener('pointerup', soltar)
      document.removeEventListener('pointercancel', soltar)
    }
  }, [arrastando])

  const mudar = (novos) => {
    setInterno(novos)
    onValueChange?.(novos)
  }

  return (
    <SliderPrimitive.Root
      {...props}
      className={`slider ${className}`.trim()}
      data-arrastando={arrastando || undefined}
      onValueChange={mudar}
      onPointerDown={() => showTooltip && setArrastando(true)}
    >
      <SliderPrimitive.Track className="slider__trilho">
        <SliderPrimitive.Range className="slider__faixa" />
      </SliderPrimitive.Track>
      {valores.map((valor, i) => {
        const dica = tooltipContent ? tooltipContent(valor) : valor
        return (
          <SliderPrimitive.Thumb
            key={i}
            className="slider__polegar"
            aria-label={thumbLabels[i]}
            aria-valuetext={typeof dica === 'string' ? dica : undefined}
          >
            {showTooltip && (
              <span className="slider__dica" aria-hidden="true">
                {dica}
              </span>
            )}
          </SliderPrimitive.Thumb>
        )
      })}
    </SliderPrimitive.Root>
  )
}
