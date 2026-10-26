import { useCallback, useEffect, useRef, useState } from 'react'
import { assistenteService } from '../services/assistenteService'
import { useSacola } from './useSacola'
import { useSession } from './useSession'

// Conversa do assistente do site. Fica no navegador (id e chave) para continuar ao trocar de página; se a
// conta muda (entrou ou saiu), começa outra, porque a conversa de um cliente só abre na conta dele.
const CHAVE = 'casalorenzi.assistente'

function ler() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE))
  } catch {
    return null
  }
}

function gravar(valor) {
  try {
    if (valor) localStorage.setItem(CHAVE, JSON.stringify(valor))
    else localStorage.removeItem(CHAVE)
  } catch {
    // Sem armazenamento (aba anônima): a conversa vale só enquanto a página estiver aberta
  }
}

const novoId = () => (globalThis.crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`)

function mensagemDeErro(erro) {
  if (erro?.status === 429) return 'Muitas mensagens seguidas. Aguarde alguns minutos e tente de novo.'
  if (erro?.status === 409) return 'Ainda estou respondendo a mensagem anterior. Tente de novo em instantes.'
  if (!erro?.status) return 'Sem conexão com o servidor. Confira a internet e tente de novo.'
  return erro.message || 'Não consegui responder agora.'
}

export function useAssistente(marca) {
  const { usuario, isCliente } = useSession()
  const sacola = useSacola()
  const dono = isCliente ? usuario.id : null
  const [conversa, setConversa] = useState(null)
  const [mensagens, setMensagens] = useState([])
  const [status, setStatus] = useState('ociosa') // ociosa | carregando | pronta | erro
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState(null)
  const iniciada = useRef(false)

  const criar = useCallback(async () => {
    const nova = await assistenteService.abrir(marca)
    const registro = { id: nova.id, chave: nova.chave, dono }
    gravar(registro)
    setConversa(registro)
    setMensagens(nova.mensagens)
    return registro
  }, [marca, dono])

  const iniciar = useCallback(async () => {
    setStatus('carregando')
    setErro(null)
    try {
      const salvo = ler()
      if (salvo?.id && salvo.dono === dono) {
        try {
          const dados = await assistenteService.obter(salvo.id, salvo.chave)
          if (dados.status !== 'ENCERRADA') {
            setConversa(salvo)
            setMensagens(dados.mensagens)
            setStatus('pronta')
            return
          }
        } catch (e) {
          if (![404, 410].includes(e.status)) throw e
        }
      }
      await criar()
      setStatus('pronta')
    } catch (e) {
      setErro({ mensagem: mensagemDeErro(e) })
      setStatus('erro')
    }
  }, [dono, criar])

  // Entrou ou saiu da conta com o painel já aberto: recomeça com a conversa certa
  useEffect(() => {
    if (iniciada.current) iniciar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dono])

  const abrirPainel = useCallback(() => {
    if (iniciada.current) return
    iniciada.current = true
    iniciar()
  }, [iniciar])

  const enviar = useCallback(
    async (texto, acao) => {
      const limpo = (texto ?? '').trim()
      if (!limpo || enviando || !conversa) return
      const idCliente = novoId()
      const provisoria = { id: `local-${idCliente}`, papel: 'USUARIO', texto: limpo, blocos: [], local: true }
      setMensagens((atual) => [...atual, provisoria])
      setEnviando(true)
      setErro(null)
      const dados = { texto: limpo, idCliente, ...(acao ? { acao } : {}) }
      try {
        let resultado
        try {
          resultado = await assistenteService.enviar(conversa.id, conversa.chave, dados)
        } catch (e) {
          // Conversa encerrada ou vencida: começa outra e manda a mesma mensagem nela
          if (e.status !== 404 && e.status !== 410) throw e
          const nova = await criar()
          resultado = await assistenteService.enviar(nova.id, nova.chave, dados)
        }
        setMensagens((atual) => [...atual.filter((m) => m.id !== provisoria.id), resultado.pergunta, resultado.resposta])
      } catch (e) {
        setMensagens((atual) => atual.filter((m) => m.id !== provisoria.id))
        setErro({ mensagem: mensagemDeErro(e), texto: limpo, acao })
      } finally {
        setEnviando(false)
      }
    },
    [conversa, enviando, criar],
  )

  const repetir = useCallback(() => {
    if (erro?.texto) enviar(erro.texto, erro.acao)
    else iniciar()
  }, [erro, enviar, iniciar])

  const novaConversa = useCallback(async () => {
    if (conversa) assistenteService.encerrar(conversa.id, conversa.chave).catch(() => {})
    setStatus('carregando')
    setErro(null)
    try {
      await criar()
      setStatus('pronta')
    } catch (e) {
      setErro({ mensagem: mensagemDeErro(e) })
      setStatus('erro')
    }
  }, [conversa, criar])

  // "Adicionar à sacola": a sacola é a mesma da página do produto; a conversa só registra o que aconteceu
  const confirmarSacola = useCallback(
    (mensagemId, item) => {
      sacola.adicionar({ ...item, quantidade: undefined })
      setMensagens((atual) =>
        atual.map((m) =>
          m.id !== mensagemId
            ? m
            : { ...m, blocos: m.blocos.map((b) => (b.tipo === 'acao_sacola' && b.item.variacaoId === item.variacaoId ? { ...b, estado: 'CONFIRMADO' } : b)) },
        ),
      )
      if (conversa) assistenteService.registrarSacola(conversa.id, conversa.chave, mensagemId, item.variacaoId).catch(() => {})
    },
    [conversa, sacola],
  )

  // Abre um chamado com a equipe (exige login de cliente) e recarrega a conversa com a confirmação
  const encaminhar = useCallback(
    async (motivo) => {
      if (!conversa) return null
      const resultado = await assistenteService.encaminhar(conversa.id, conversa.chave, motivo)
      const dados = await assistenteService.obter(conversa.id, conversa.chave)
      setMensagens(dados.mensagens)
      return resultado
    },
    [conversa],
  )

  return { mensagens, status, enviando, erro, abrirPainel, enviar, repetir, novaConversa, confirmarSacola, encaminhar, logado: isCliente }
}
