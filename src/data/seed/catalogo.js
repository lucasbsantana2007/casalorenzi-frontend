export const LOJAS = [
  { id: 1, nome: 'Oscar Freire', cidade: 'São Paulo', uf: 'SP' },
  { id: 2, nome: 'Iguatemi São Paulo', cidade: 'São Paulo', uf: 'SP' },
  { id: 3, nome: 'Leblon', cidade: 'Rio de Janeiro', uf: 'RJ' },
  { id: 4, nome: 'Pátio Batel', cidade: 'Curitiba', uf: 'PR' },
]

export const CATEGORIAS = ['Camisaria', 'Alfaiataria', 'Vestidos', 'Tricô', 'Malharia', 'Saias', 'Outerwear', 'Acessórios']

// As variações são derivadas de tamanhos × cores em generate.js
export const PRODUTOS = [
  { id: 1, nome: 'Camisa de Linho Toscana', categoria: 'Camisaria', precoBase: 489, codigo: 'CML', tamanhos: ['P', 'M', 'G'], cores: ['Branco', 'Azul Céu'] },
  { id: 2, nome: 'Camisa Oxford Slim', categoria: 'Camisaria', precoBase: 369, codigo: 'COX', tamanhos: ['P', 'M', 'G'], cores: ['Marinho'] },
  { id: 3, nome: 'Calça de Alfaiataria Lã Fria', categoria: 'Alfaiataria', precoBase: 649, codigo: 'CAL', tamanhos: ['40', '42', '44'], cores: ['Grafite', 'Marinho'] },
  { id: 4, nome: 'Blazer Milano', categoria: 'Alfaiataria', precoBase: 1490, codigo: 'BLZ', tamanhos: ['48', '50', '52'], cores: ['Marinho'] },
  { id: 5, nome: 'Vestido Midi de Seda', categoria: 'Vestidos', precoBase: 1190, codigo: 'VMS', tamanhos: ['P', 'M', 'G'], cores: ['Off-white', 'Verde Oliva'] },
  { id: 6, nome: 'Suéter de Cashmere Gola Careca', categoria: 'Tricô', precoBase: 1290, codigo: 'SCC', tamanhos: ['P', 'M', 'G'], cores: ['Camel'] },
  { id: 7, nome: 'Cardigã de Lã Merino', categoria: 'Tricô', precoBase: 789, codigo: 'CLM', tamanhos: ['P', 'M', 'G'], cores: ['Cinza Mescla'] },
  { id: 8, nome: 'Polo Piquet Pima', categoria: 'Malharia', precoBase: 329, codigo: 'PPP', tamanhos: ['P', 'M', 'G'], cores: ['Marinho', 'Branco'] },
  { id: 9, nome: 'Saia Plissada Midi', categoria: 'Saias', precoBase: 559, codigo: 'SPM', tamanhos: ['36', '38', '40'], cores: ['Preto'] },
  { id: 10, nome: 'Trench Coat Gabardine', categoria: 'Outerwear', precoBase: 2190, codigo: 'TRC', tamanhos: ['P', 'M', 'G'], cores: ['Bege'] },
  { id: 11, nome: 'Cinto de Couro Trançado', categoria: 'Acessórios', precoBase: 279, codigo: 'CCT', tamanhos: ['90', '100'], cores: ['Conhaque'] },
  { id: 12, nome: 'Lenço de Seda Estampado', categoria: 'Acessórios', precoBase: 349, codigo: 'LSE', tamanhos: ['Único'], cores: ['Azul Riviera'] },
  { id: 13, nome: 'Bermuda de Sarja Resort', categoria: 'Alfaiataria', precoBase: 399, codigo: 'BSR', tamanhos: ['40', '42', '44'], cores: ['Areia'], ativo: false },
]
