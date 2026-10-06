export const LOJAS = [
  { id: 1, nome: 'Oscar Freire', cidade: 'São Paulo', uf: 'SP' },
  { id: 2, nome: 'Lago Sul', cidade: 'Brasília', uf: 'DF' },
  { id: 3, nome: 'Leblon', cidade: 'Rio de Janeiro', uf: 'RJ' },
  { id: 4, nome: 'Pátio Batel', cidade: 'Curitiba', uf: 'PR' },
  { id: 5, nome: 'Belvedere', cidade: 'Belo Horizonte', uf: 'MG' },
]

export const CATEGORIAS = ['Camisaria', 'Alfaiataria', 'Vestidos', 'Tricô', 'Malharia', 'Saias', 'Outerwear', 'Acessórios']

// As variações são derivadas de tamanhos × cores em estoque.js.
// genero/estacao alimentam a navegação da vitrine (Masculino, Feminino, Inverno, Verão).
export const PRODUTOS = [
  { id: 1, genero: 'Masculino', estacao: 'Verão', nome: 'Camisa de Linho Toscana', categoria: 'Camisaria', precoBase: 489, codigo: 'CML', tamanhos: ['P', 'M', 'G'], cores: ['Branco', 'Azul Céu'] },
  { id: 2, genero: 'Masculino', estacao: 'Atemporal', nome: 'Camisa de Linho Positano', categoria: 'Camisaria', precoBase: 369, codigo: 'COX', tamanhos: ['P', 'M', 'G'], cores: ['Marinho'] },
  { id: 3, genero: 'Masculino', estacao: 'Verão', nome: 'Calça de Linho Amalfi', categoria: 'Alfaiataria', precoBase: 649, codigo: 'CAL', tamanhos: ['40', '42', '44'], cores: ['Grafite', 'Marinho'] },
  { id: 4, genero: 'Masculino', estacao: 'Inverno', nome: 'Jaqueta de Camurça Capri', categoria: 'Outerwear', precoBase: 1490, codigo: 'JCC', tamanhos: ['48', '50', '52'], cores: ['Caramelo'] },
  { id: 5, genero: 'Feminino', estacao: 'Verão', nome: 'Vestido Midi de Seda', categoria: 'Vestidos', precoBase: 1190, codigo: 'VMS', tamanhos: ['P', 'M', 'G'], cores: ['Off-white', 'Verde Oliva'] },
  { id: 6, genero: 'Feminino', estacao: 'Inverno', nome: 'Suéter de Cashmere Gola Careca', categoria: 'Tricô', precoBase: 1290, codigo: 'SCC', tamanhos: ['P', 'M', 'G'], cores: ['Camel'] },
  { id: 7, genero: 'Feminino', estacao: 'Inverno', nome: 'Cardigã de Lã Merino', categoria: 'Tricô', precoBase: 789, codigo: 'CLM', tamanhos: ['P', 'M', 'G'], cores: ['Cinza Mescla'] },
  { id: 8, genero: 'Masculino', estacao: 'Verão', nome: 'Polo Piquet Pima', categoria: 'Malharia', precoBase: 329, codigo: 'PPP', tamanhos: ['P', 'M', 'G'], cores: ['Marinho', 'Branco'] },
  { id: 9, genero: 'Feminino', estacao: 'Atemporal', nome: 'Saia Plissada Midi', categoria: 'Saias', precoBase: 559, codigo: 'SPM', tamanhos: ['36', '38', '40'], cores: ['Preto'] },
  { id: 10, genero: 'Feminino', estacao: 'Inverno', nome: 'Trench Coat Gabardine', categoria: 'Outerwear', precoBase: 2190, codigo: 'TRC', tamanhos: ['P', 'M', 'G'], cores: ['Bege'] },
  { id: 11, genero: 'Masculino', estacao: 'Atemporal', nome: 'Cinto de Couro Trançado', categoria: 'Acessórios', precoBase: 279, codigo: 'CCT', tamanhos: ['90', '100'], cores: ['Conhaque'] },
  { id: 12, genero: 'Feminino', estacao: 'Verão', nome: 'Lenço de Seda Estampado', categoria: 'Acessórios', precoBase: 349, codigo: 'LSE', tamanhos: ['Único'], cores: ['Azul Riviera'] },
  { id: 13, genero: 'Masculino', estacao: 'Verão', nome: 'Bermuda de Sarja Resort', categoria: 'Alfaiataria', precoBase: 399, codigo: 'BSR', tamanhos: ['40', '42', '44'], cores: ['Areia'], ativo: false },
]
