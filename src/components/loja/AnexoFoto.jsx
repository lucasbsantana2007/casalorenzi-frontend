import { ImagePlus, X } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import { formatarTamanho, prepararFoto, TAMANHO_ORIGINAL_MAX, TIPOS_IMAGEM } from '../../utils/imagem'

// Foto opcional do chamado (defeito da peça, comprovante): escolher ou arrastar, reduzir no navegador e pré-visualizar.
// `value` é o resultado de prepararFoto (ou null); `onProcessando` avisa o formulário para segurar o envio.
export function AnexoFoto({ value, onChange, onProcessando }) {
  const [erro, setErro] = useState(null)
  const [processando, setProcessando] = useState(false)
  const [arrastando, setArrastando] = useState(false)
  const inputRef = useRef(null)
  const ultimaEscolha = useRef(0)
  const rotuloId = useId()
  const dicaId = useId()
  const erroId = useId()

  const ocupado = (v) => {
    setProcessando(v)
    onProcessando?.(v)
  }

  const escolher = async (arquivo) => {
    if (!arquivo) return
    const escolha = ++ultimaEscolha.current
    setErro(null)
    ocupado(true)
    try {
      const foto = await prepararFoto(arquivo)
      if (escolha === ultimaEscolha.current) onChange(foto)
    } catch (error) {
      if (escolha === ultimaEscolha.current) setErro(error.message)
    } finally {
      if (escolha === ultimaEscolha.current) ocupado(false)
    }
  }

  const remover = () => {
    onChange(null)
    setErro(null)
    // Devolve o foco para a área de escolha, que volta a aparecer no lugar da miniatura
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  const soltar = (e) => {
    e.preventDefault()
    setArrastando(false)
    escolher(e.dataTransfer.files?.[0])
  }

  return (
    <div className="photo-attach">
      <span className="photo-attach__label" id={rotuloId}>
        Anexe uma foto (opcional)
      </span>

      {value ? (
        <div className="photo-attach__preview">
          <img src={value.url} alt="Pré-visualização da foto anexada" />
          <span className="photo-attach__info">
            <strong>{value.nome}</strong>
            <small>{formatarTamanho(value.tamanho)} · pronta para envio</small>
          </span>
          <button type="button" className="photo-attach__remove" onClick={remover}>
            <X size={14} aria-hidden="true" /> Remover
          </button>
        </div>
      ) : (
        <label
          className={`photo-attach__drop ${arrastando ? 'is-over' : ''} ${processando ? 'is-busy' : ''}`}
          onDragOver={(e) => {
            e.preventDefault()
            setArrastando(true)
          }}
          onDragLeave={(e) => !e.currentTarget.contains(e.relatedTarget) && setArrastando(false)}
          onDrop={soltar}
        >
          <ImagePlus size={22} strokeWidth={1.5} aria-hidden="true" />
          <span className="photo-attach__cta">
            {processando ? (
              'Preparando a foto…'
            ) : (
              <>
                <strong>Escolher foto</strong> ou arraste aqui
              </>
            )}
          </span>
          <small id={dicaId}>Foto do defeito ou comprovante · JPG, PNG ou WebP até {formatarTamanho(TAMANHO_ORIGINAL_MAX)}</small>
          <input
            ref={inputRef}
            type="file"
            className="sr-only"
            accept={TIPOS_IMAGEM.join(',')}
            aria-labelledby={rotuloId}
            aria-describedby={erro ? `${dicaId} ${erroId}` : dicaId}
            aria-invalid={erro ? 'true' : undefined}
            disabled={processando}
            onChange={(e) => {
              escolher(e.target.files?.[0])
              e.target.value = '' // permite escolher o mesmo arquivo de novo depois de remover
            }}
          />
        </label>
      )}

      {erro && (
        <p className="co-error" id={erroId} role="alert">
          {erro}
        </p>
      )}
    </div>
  )
}
