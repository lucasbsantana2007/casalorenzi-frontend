import { USE_MOCKS } from '../config/env'
import { api } from './api'
import * as mock from './mock/conta'

// Configurações da conta do cliente logado (o cliente vem do token; a equipe não usa).
export const contaService = USE_MOCKS
  ? mock
  : {
      // → { id, nome, email, cpf, telefone, clienteDesde }
      obter: () => api.get('/conta'),
      // { nome, email, telefone, senhaAtual? } → mesma resposta. O CPF não muda;
      // trocar o e-mail (que é o login) pede senhaAtual. 409 se o e-mail já tiver conta
      atualizar: (dados) => api.put('/conta', dados),
      // { senhaAtual, senha, senhaConfirmacao } → sem corpo. Senha atual errada: 422
      trocarSenha: (dados) => api.put('/conta/senha', dados),
      // { senha } → sem corpo. Apaga os dados pessoais e encerra o acesso; pedidos e solicitações ficam anônimos
      excluir: (dados) => api.post('/conta/exclusao', dados),
    }
