import { USE_MOCKS } from '../config/env'
import { api } from './api'
import * as mock from './mock/produtos'

export const produtosService = USE_MOCKS
  ? mock
  : {
      // filtros: { busca, categoria, ativo }
      listar: (filtros) => api.get('/produtos', filtros),
      obter: (id) => api.get(`/produtos/${id}`),
      // { nome, categoria, precoBase, ativo, variacoes: [{ id?, sku, tamanho, cor, precoCusto }] }
      // Só Administrador; o preço de custo nunca vai para as rotas públicas da loja.
      // Foto: imagem: { nome, tipo, conteudoBase64 } (JPG/PNG/WebP, até 2 MB, já reduzida no navegador) troca a foto;
      // removerImagem: true volta à ilustração. O backend grava no S3 e devolve imagemUrl no produto
      criar: (dados) => api.post('/produtos', dados),
      atualizar: (id, dados) => api.put(`/produtos/${id}`, dados),
    }
