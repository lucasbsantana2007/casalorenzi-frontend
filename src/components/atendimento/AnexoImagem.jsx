import { Download } from 'lucide-react'
import { useState } from 'react'
import { Modal } from '../ui/Modal'

// Foto anexada a uma mensagem: miniatura na conversa; o clique abre a imagem ampliada
export function AnexoImagem({ anexo }) {
  const [aberto, setAberto] = useState(false)

  return (
    <>
      <button type="button" className="thread__photo" onClick={() => setAberto(true)} aria-label={`Ampliar a foto ${anexo.nome}`}>
        <img src={anexo.url} alt="" loading="lazy" />
      </button>

      <Modal
        open={aberto}
        onClose={() => setAberto(false)}
        title="Foto anexada"
        description={anexo.nome}
        size="lg"
        footer={
          <a className="btn btn-secondary" href={anexo.url} download={anexo.nome}>
            <Download size={14} aria-hidden="true" /> Baixar foto
          </a>
        }
      >
        <img className="thread__photo-full" src={anexo.url} alt={`Foto anexada: ${anexo.nome}`} />
      </Modal>
    </>
  )
}
