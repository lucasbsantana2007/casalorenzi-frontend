// USUARIO { id, papel } — complementado com dados de exibição.
export const USUARIOS = [
  { id: 1, nome: 'Helena Lorenzi', email: 'helena@casalorenzi.com.br', papel: 'ADMINISTRADOR', lojaId: null },
  { id: 2, nome: 'Rafael Monteiro', email: 'rafael.monteiro@casalorenzi.com.br', papel: 'LOJISTA', lojaId: 1 },
  { id: 3, nome: 'Beatriz Carvalho', email: 'beatriz.carvalho@casalorenzi.com.br', papel: 'LOJISTA', lojaId: 2 },
  { id: 4, nome: 'André Siqueira', email: 'andre.siqueira@casalorenzi.com.br', papel: 'LOJISTA', lojaId: 3 },
  { id: 5, nome: 'Camila Rocha', email: 'camila.rocha@casalorenzi.com.br', papel: 'LOJISTA', lojaId: 4 },
  { id: 6, nome: 'Diego Almeida', email: 'diego.almeida@casalorenzi.com.br', papel: 'OPERADOR', lojaId: 1 },
  { id: 7, nome: 'Carla Nunes', email: 'carla.nunes@casalorenzi.com.br', papel: 'OPERADOR', lojaId: 3 },
  { id: 8, nome: 'Marina Duarte', email: 'marina.duarte@casalorenzi.com.br', papel: 'LOJISTA', lojaId: 5 },
]

export const CLIENTES = [
  { id: 101, nome: 'Mariana Costa', email: 'mariana.costa@gmail.com', telefone: '(11) 98422-1937', clienteDesde: '2021-03-14', lojaPreferidaId: 1 },
  { id: 102, nome: 'Ricardo Fonseca', email: 'ricardo.fonseca@outlook.com', telefone: '(61) 99710-4402', clienteDesde: '2019-11-02', lojaPreferidaId: 2 },
  { id: 103, nome: 'Juliana Prado', email: 'ju.prado@gmail.com', telefone: '(21) 98134-7750', clienteDesde: '2022-06-21', lojaPreferidaId: 3 },
  { id: 104, nome: 'Felipe Andrade', email: 'felipe.andrade@icloud.com', telefone: '(41) 99288-3016', clienteDesde: '2023-01-09', lojaPreferidaId: 4 },
  { id: 105, nome: 'Luiza Bastos', email: 'luiza.bastos@gmail.com', telefone: '(21) 99640-2281', clienteDesde: '2020-08-30', lojaPreferidaId: 3 },
  { id: 106, nome: 'Gustavo Tavares', email: 'gustavo.tavares@gmail.com', telefone: '(31) 97455-6190', clienteDesde: '2024-02-17', lojaPreferidaId: 5 },
  { id: 107, nome: 'Patrícia Moreira', email: 'patricia.moreira@uol.com.br', telefone: '(61) 98820-5573', clienteDesde: '2018-05-05', lojaPreferidaId: 2 },
  { id: 108, nome: 'Thiago Ribeiro', email: 'thiago.ribeiro@gmail.com', telefone: '(41) 99107-8834', clienteDesde: '2023-09-12', lojaPreferidaId: 4 },
].map((cliente) => ({ ...cliente, papel: 'CLIENTE' }))
