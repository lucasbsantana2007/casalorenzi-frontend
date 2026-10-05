import { USE_MOCKS } from '../config/env'
import { api } from './api'
import * as mock from './mock/auth'

export const authService = USE_MOCKS
  ? mock
  : {
      // { email, senha } → { token, usuario: { id, nome, email, papel, lojaId } }
      login: (credenciais) => api.post('/auth/login', credenciais),
    }
