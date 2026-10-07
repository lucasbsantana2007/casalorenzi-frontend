import { ImagePlus, Trash2 } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import { formatarTamanho, prepararFoto, TIPOS_IMAGEM } from '../../utils/imagem'

// Foto do produto no cadastro. `foto` é o resultado de prepararFoto (nova foto escolhida),
// `atual` é a imagem que o produto já mostra (enviada ou ilustração) e `removida` indica
// que a foto enviada vai sair (volta para a ilustração).
export function FotoProdutoCampo({ foto, atual, temFotoEnviada, removida, onEscolher, onRemover, onProcessando }) {
  const [erro, setErro] = useState(null)
  const [processando, setProcessando] = useState(false)
  const inputRef = useRef(null)
  const rotuloId = useId()
  const dicaId = useId()

  async function escolher(arquivo) {
    if (!arquivo) return
    setErro(null)
    setProcessando(true)
    onProcessando?.(true)
    try {
      onEscolher(await prepararFoto(arquivo))
    } catch (error) {
      setErro(error.message)
    } finally {
      setProcessando(false)
      onProcessando?.(false)
      inputRef.current.value = ''
    }
  }

  const mostrando = foto?.url ?? (removida ? null : atual)
  const descricao = foto
    ? `Nova foto: ${foto.nome} · ${formatarTamanho(foto.tamanho)}`
    : removida
      ? 'A foto enviada será removida ao salvar; o produto volta a usar a ilustração.'
      : temFotoEnviada
        ? 'Foto enviada.'
        : 'Sem foto enviada: o site mostra uma imagem ilustrativa.'

  return (
    <div className="foto-produto">
      <span id={rotuloId} className="field__label">
        Foto do produto
      </span>
      <div className="foto-produto__corpo">
        <div className={`foto-produto__previa ${mostrando ? '' : 'is-vazia'}`}>
          {mostrando ? <img src={mostrando} alt="Prévia da foto do produto" /> : <ImagePlus size={22} aria-hidden="true" />}
        </div>
        <div className="foto-produto__acoes">
          <p className="foto-produto__estado">{processando ? 'Preparando a foto…' : descricao}</p>
          <div className="foto-produto__botoes">
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => inputRef.current.click()} disabled={processando} aria-describedby={dicaId}>
              <ImagePlus size={14} /> {foto || temFotoEnviada ? 'Trocar foto' : 'Escolher foto'}
            </button>
            {(foto || (temFotoEnviada && !removida)) && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={onRemover} disabled={processando}>
                <Trash2 size={14} /> Remover
              </button>
            )}
          </div>
          <span id={dicaId} className="field__hint">
            JPG, PNG ou WebP. A foto é reduzida antes de enviar (até 1280 px).
          </span>
          {erro && (
            <span className="foto-produto__erro" role="alert">
              {erro}
            </span>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={TIPOS_IMAGEM.join(',')}
        className="sr-only"
        aria-labelledby={rotuloId}
        tabIndex={-1}
        onChange={(e) => escolher(e.target.files?.[0])}
      />
    </div>
  )
}
