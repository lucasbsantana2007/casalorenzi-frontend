import belvedere from '../assets/lojas/belvedere.jpg'
import lagoNorte from '../assets/lojas/lago-norte.jpg'
import leblon from '../assets/lojas/leblon.jpg'
import oscarFreire from '../assets/lojas/oscar-freire.jpg'
import patioBatel from '../assets/lojas/patio-batel.jpg'

// Foto, endereço, contato e horários de cada loja na página Lojas. A chave é o nome da loja (vem da API).
export const DETALHES_LOJAS = {
  'Oscar Freire': {
    foto: oscarFreire,
    endereco: 'Rua Oscar Freire, 645 - Cerqueira César, São Paulo - SP',
    telefone: '+55 11 93394-9003',
    horarios: ['Quarta a domingo: 10:00–18:00'],
  },
  'Lago Norte': {
    foto: lagoNorte,
    endereco: 'Shopping Iguatemi, 1º Piso - St. de Habitações Individuais Norte CA 4, Lago Norte, Brasília - DF',
    telefone: '+55 61 99674-1929',
    horarios: ['Segunda a sábado: 10:00–22:00', 'Domingo: 12:00–20:00'],
  },
  Leblon: {
    foto: leblon,
    endereco: 'Av. Afrânio de Melo Franco, 290, Piso L1 - Leblon, Rio de Janeiro - RJ',
    telefone: '+55 11 91717-9405',
    horarios: ['Segunda a sábado: 10:00–22:00', 'Domingo: 13:00–21:00'],
  },
  'Pátio Batel': {
    foto: patioBatel,
    endereco: 'Av. do Batel, 1868, Shopping Batel (Piso L2) - Batel, Curitiba - PR',
    telefone: '+55 11 91652-9058',
    horarios: ['Segunda a sábado: 10:00–22:00', 'Domingo: 12:00–20:00', 'Feriados: 14:00–20:00'],
  },
  Belvedere: {
    foto: belvedere,
    endereco: 'Meeting Shops - R. Dicíola Horta, 77 - Belvedere, Belo Horizonte - MG',
    telefone: '+55 31 8435-7742',
    horarios: ['Segunda a sábado: 10:00–20:00', 'Domingo: 10:00–16:00'],
  },
}
