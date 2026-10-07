// Frete inicial: por região do CEP, quanto o cliente paga (valor), quanto custa para a loja (custo)
// e o prazo em dias úteis. Editável pelo Administrador em Administração > Frete.
// Os custos são de demonstração; na operação real vêm do contrato com a transportadora.
export const FRETE_INICIAL = {
  gratisMinimo: 1000,
  expressoAtivo: true,
  regioes: [
    { regiao: 'SP', nome: 'Estado de São Paulo', padrao: { valor: 19.9, custo: 16.5, prazoDias: 3 }, expresso: { valor: 39.9, custo: 31, prazoDias: 1 } },
    { regiao: 'SUDESTE', nome: 'Rio de Janeiro, Espírito Santo e Minas Gerais', padrao: { valor: 29.9, custo: 24, prazoDias: 5 }, expresso: { valor: 59.9, custo: 46, prazoDias: 2 } },
    { regiao: 'SUL', nome: 'Região Sul', padrao: { valor: 34.9, custo: 29, prazoDias: 6 }, expresso: { valor: 64.9, custo: 52, prazoDias: 3 } },
    { regiao: 'CENTRO_OESTE', nome: 'Região Centro-Oeste', padrao: { valor: 39.9, custo: 33, prazoDias: 7 }, expresso: { valor: 74.9, custo: 58, prazoDias: 3 } },
    { regiao: 'NORDESTE', nome: 'Região Nordeste', padrao: { valor: 44.9, custo: 38, prazoDias: 9 }, expresso: { valor: 84.9, custo: 66, prazoDias: 4 } },
    { regiao: 'NORTE', nome: 'Região Norte', padrao: { valor: 54.9, custo: 47, prazoDias: 12 }, expresso: { valor: 99.9, custo: 78, prazoDias: 5 } },
  ],
}
