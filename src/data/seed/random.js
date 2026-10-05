// Gerador pseudoaleatório com semente: os dados de demonstração são sempre os mesmos.
export function createRandom(seed) {
  let a = seed
  const rand = () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  rand.int = (min, max) => Math.floor(rand() * (max - min + 1)) + min
  rand.pick = (list) => list[Math.floor(rand() * list.length)]
  rand.chance = (p) => rand() < p
  return rand
}

const DAY = 86400000

// Datas relativas ao momento em que a aplicação carrega, para que a demo pareça sempre atual.
export const NOW = Date.now()

export function daysAgo(days, hour = 10, minute = 0) {
  const d = new Date(NOW - days * DAY)
  d.setHours(hour, minute, 0, 0)
  // Horários de hoje que ainda não chegaram são distribuídos nas últimas horas
  if (d.getTime() > NOW - 60000) return NOW - (((hour * 60 + minute) % 240) + 3) * 60000
  return d.getTime()
}
