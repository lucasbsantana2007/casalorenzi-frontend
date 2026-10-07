import { USE_MOCKS } from '../config/env'
import { api } from './api'
import * as mock from './mock/administracao'

// Central administrativa. Todas as rotas exigem Administrador (403 para os demais cargos)
// e gravam no log quem fez a alteração (a partir do token).
export const administracaoService = USE_MOCKS
  ? mock
  : {
      // filtros: { busca, papel, lojaId, status: 'ATIVO' | 'INATIVO' }
      listarFuncionarios: (filtros) => api.get('/admin/funcionarios', filtros),
      // { nome, email, papel, lojaId } → { funcionario }. Envia por e-mail o convite para criar a senha (7 dias)
      criarFuncionario: (dados) => api.post('/admin/funcionarios', dados),
      atualizarFuncionario: (id, dados) => api.put(`/admin/funcionarios/${id}`, dados),
      // { ativo }. 422 ao desativar a si mesmo ou o último Administrador ativo
      alterarStatusFuncionario: (id, dados) => api.patch(`/admin/funcionarios/${id}/status`, dados),
      reenviarConvite: (id) => api.post(`/admin/funcionarios/${id}/convite`),

      listarLojas: () => api.get('/admin/lojas'),
      // { nome, cidade, uf, endereco, telefone, horarios: string[], ativa }. Loja nova nasce com estoque zerado
      criarLoja: (dados) => api.post('/admin/lojas', dados),
      atualizarLoja: (id, dados) => api.put(`/admin/lojas/${id}`, dados),

      // filtros: { area, usuarioId, busca } → [{ id, area, acao, descricao, alteracoes: [{ campo, de, para }], usuario, criadoEm }]
      listarLog: (filtros) => api.get('/admin/log', filtros),
    }
