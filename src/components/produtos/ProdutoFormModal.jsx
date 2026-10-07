import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { produtosService } from '../../services/produtosService'
import { faixaDeMargem } from '../../utils/margem'
import { Field } from '../ui/Field'
import { FormError } from '../ui/FormError'
import { Modal } from '../ui/Modal'

const semAcento = (texto) =>
  texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()

// Sugere um SKU no padrão CL-<produto>-<cor>-<tamanho>
function sugerirSku(nome, cor, tamanho) {
  const prefixo = semAcento(nome)
    .split(/\s+/)
    .filter((p) => p.length > 2)
    .slice(0, 3)
    .map((p) => p[0])
    .join('')
  if (!prefixo || !cor || !tamanho) return ''
  return `CL-${prefixo}-${semAcento(cor).slice(0, 3)}-${semAcento(tamanho).replace(/\s/g, '')}`
}

function margemTexto(preco, variacoes) {
  const faixa = faixaDeMargem(preco, variacoes)
  return faixa ? `Margem bruta: ${faixa}` : 'Preencha o custo das variações para ver a margem.'
}

const novaVariacao = () => ({ chave: crypto.randomUUID(), sku: '', cor: '', tamanho: '', precoCusto: '', skuEditado: false })

// produto = null → cadastro; produto preenchido → edição
export function ProdutoFormModal({ open, produto, categorias, onClose, onSaved }) {
  return (
    <Modal open={open} onClose={onClose} size="lg" title={produto ? 'Editar produto' : 'Novo produto'} description="Dados comerciais e grade de variações (SKU, cor, tamanho e preço de custo).">
      {open && <ProdutoForm produto={produto} categorias={categorias} onClose={onClose} onSaved={onSaved} />}
    </Modal>
  )
}

function ProdutoForm({ produto, categorias, onClose, onSaved }) {
  const [form, setForm] = useState({
    nome: produto?.nome ?? '',
    categoria: produto?.categoria ?? '',
    precoBase: produto?.precoBase ?? '',
    ativo: produto?.ativo ?? true,
  })
  const [variacoes, setVariacoes] = useState(
    produto?.variacoes.map((v) => ({ ...v, chave: String(v.id), skuEditado: true })) ?? [novaVariacao()],
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const set = (campo) => (event) => setForm((f) => ({ ...f, [campo]: event.target.type === 'checkbox' ? event.target.checked : event.target.value }))

  function setVariacao(chave, campo, valor) {
    setVariacoes((lista) =>
      lista.map((v) => {
        if (v.chave !== chave) return v
        const next = { ...v, [campo]: valor }
        if (campo === 'sku') next.skuEditado = true
        else if (!v.skuEditado) next.sku = sugerirSku(form.nome, next.cor, next.tamanho)
        return next
      }),
    )
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setSaving(true)
    const dados = {
      ...form,
      precoBase: Number(form.precoBase),
      variacoes: variacoes.filter((v) => v.sku.trim()).map(({ id, sku, cor, tamanho, precoCusto }) => ({ id, sku, cor, tamanho, precoCusto: precoCusto === '' ? '' : Number(precoCusto) })),
    }
    try {
      if (produto) await produtosService.atualizar(produto.id, dados)
      else await produtosService.criar(dados)
      onSaved()
      onClose()
    } catch (err) {
      setError(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <div className="form-grid">
        <Field label="Nome do produto" className="span-2">
          <input className="input" value={form.nome} onChange={set('nome')} placeholder="Ex.: Camisa de Linho Toscana" required />
        </Field>
        <Field label="Categoria">
          <select className="select" value={form.categoria} onChange={set('categoria')} required>
            <option value="">Selecione…</option>
            {categorias.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Preço de venda (R$)" hint={margemTexto(form.precoBase, variacoes)}>
          <input className="input" type="number" min="0" step="0.01" value={form.precoBase} onChange={set('precoBase')} required />
        </Field>
        <label className="checkbox span-2">
          <input type="checkbox" checked={form.ativo} onChange={set('ativo')} />
          Produto ativo (disponível para venda e transferências)
        </label>
      </div>

      <fieldset className="variant-editor">
        <legend>Variações</legend>
        <div className="variant-editor__head" aria-hidden="true">
          <span>Cor</span>
          <span>Tamanho</span>
          <span>SKU</span>
          <span>Custo (R$)</span>
          <span />
        </div>
        {variacoes.map((v, index) => (
          <div key={v.chave} className="variant-editor__row">
            <input className="input" value={v.cor} onChange={(e) => setVariacao(v.chave, 'cor', e.target.value)} placeholder="Cor" aria-label={`Cor da variação ${index + 1}`} required />
            <input className="input" value={v.tamanho} onChange={(e) => setVariacao(v.chave, 'tamanho', e.target.value)} placeholder="Tam." aria-label={`Tamanho da variação ${index + 1}`} required />
            <input className="input mono" value={v.sku} onChange={(e) => setVariacao(v.chave, 'sku', e.target.value)} placeholder="CL-XXX-COR-TAM" aria-label={`SKU da variação ${index + 1}`} required />
            <input
              className="input"
              type="number"
              min="0"
              step="0.01"
              value={v.precoCusto ?? ''}
              onChange={(e) => setVariacao(v.chave, 'precoCusto', e.target.value)}
              placeholder="0,00"
              aria-label={`Preço de custo da variação ${index + 1}`}
              required
            />
            {v.id ? (
              <span className="subtle" title="Variações com histórico de estoque não podem ser removidas">Salva</span>
            ) : (
              <button type="button" className="btn btn-ghost btn-icon" onClick={() => setVariacoes((l) => l.filter((x) => x.chave !== v.chave))} aria-label="Remover variação" disabled={variacoes.length === 1}>
                <Trash2 size={15} />
              </button>
            )}
          </div>
        ))}
        <button type="button" className="btn btn-ghost btn-sm variant-editor__add" onClick={() => setVariacoes((l) => [...l, novaVariacao()])}>
          <Plus size={14} /> Adicionar variação
        </button>
      </fieldset>

      <FormError error={error} />

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Salvando…' : produto ? 'Salvar alterações' : 'Cadastrar produto'}
        </button>
      </div>
    </form>
  )
}
