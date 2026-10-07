import { USE_MOCKS } from '../config/env'
import { api } from './api'
import * as mock from './mock/auth'

export const authService = USE_MOCKS
  ? mock
  : {
      // { email, senha } → { token, usuario: { id, nome, email, papel, lojaId } }
      // Serve para equipe e clientes; o id do cliente é o CPF
      login: (credenciais) => api.post('/auth/login', credenciais),
      // { nome, cpf, email, telefone, senha, senhaConfirmacao } → mesma resposta do login
      // cpf só com dígitos; 409 se o CPF ou o e-mail já tiverem conta
      cadastrarCliente: (dados) => api.post('/auth/cadastro', dados),
      // { email } → { enviado: true }. Mesma resposta exista ou não a conta; envia e-mail com link
      // (/login/nova-senha?token=...), válido por 30 minutos e de uso único. Limitar tentativas no servidor
      solicitarNovaSenha: (dados) => api.post('/auth/esqueci-senha', dados),
      // { token, senha, senhaConfirmacao } → { email }. 410 se o link expirou ou já foi usado
      redefinirSenha: (dados) => api.post('/auth/redefinir-senha', dados),
    }
