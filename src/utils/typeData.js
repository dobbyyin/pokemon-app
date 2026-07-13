export const typeNameZh = {
  normal: '一般', fire: '火', water: '水', electric: '電',
  grass: '草', ice: '冰', fighting: '格鬥', poison: '毒',
  ground: '地面', flying: '飛行', psychic: '超能力', bug: '蟲',
  rock: '岩石', ghost: '幽靈', dragon: '龍', dark: '惡',
  steel: '鋼', fairy: '妖精', stellar: '星晶', unknown: '???',
}

export const typeColors = {
  normal: '#9fa19f', fire: '#e62829', water: '#2980ef', electric: '#fac000',
  grass: '#3fa129', ice: '#3dcef3', fighting: '#ff8000', poison: '#9141cb',
  ground: '#915121', flying: '#81b9ef', psychic: '#ef4179', bug: '#91a119',
  rock: '#afa981', ghost: '#704170', dragon: '#5060e1', dark: '#624d4e',
  steel: '#60a1b8', fairy: '#ef70ef', stellar: '#40b5a5', unknown: '#68a090',
}

// 攻擊該屬性 2x 有效的防守屬性
export const typeAdvantages = {
  normal: [],
  fire: ['grass', 'bug', 'ice', 'steel'],
  water: ['fire', 'ground', 'rock'],
  electric: ['water', 'flying'],
  grass: ['water', 'ground', 'rock'],
  ice: ['grass', 'ground', 'flying', 'dragon'],
  fighting: ['normal', 'ice', 'rock', 'dark', 'steel'],
  poison: ['grass', 'fairy'],
  ground: ['fire', 'electric', 'poison', 'rock', 'steel'],
  flying: ['grass', 'fighting', 'bug'],
  psychic: ['fighting', 'poison'],
  bug: ['grass', 'psychic', 'dark'],
  rock: ['fire', 'ice', 'flying', 'bug'],
  ghost: ['ghost', 'psychic'],
  dragon: ['dragon'],
  dark: ['ghost', 'psychic'],
  steel: ['ice', 'rock', 'fairy'],
  fairy: ['fighting', 'dragon', 'dark'],
  stellar: [], unknown: [],
}

// 防守該屬性時弱點的攻擊屬性
export const typeWeaknesses = {
  normal: ['fighting'],
  fire: ['water', 'rock', 'ground'],
  water: ['electric', 'grass'],
  electric: ['ground'],
  grass: ['fire', 'flying', 'ice', 'poison', 'bug'],
  ice: ['fire', 'fighting', 'rock', 'steel'],
  fighting: ['flying', 'psychic', 'fairy'],
  poison: ['ground', 'psychic'],
  ground: ['water', 'ice', 'grass'],
  flying: ['electric', 'ice', 'rock'],
  psychic: ['bug', 'ghost', 'dark'],
  bug: ['fire', 'flying', 'rock'],
  rock: ['water', 'grass', 'fighting', 'ground', 'steel'],
  ghost: ['ghost', 'dark'],
  dragon: ['ice', 'dragon', 'fairy'],
  dark: ['fighting', 'bug', 'fairy'],
  steel: ['fire', 'fighting', 'ground'],
  fairy: ['poison', 'steel'],
  stellar: [], unknown: [],
}

export const statNameZh = {
  hp: 'HP', attack: '攻擊', defense: '防禦',
  'special-attack': '特攻', 'special-defense': '特防', speed: '速度',
}

export function calcLv100Stat(base, statName) {
  if (statName === 'hp') return 2 * base + 141
  return 2 * base + 36
}

export function statColor(val) {
  if (val >= 150) return '#a0e080'
  if (val >= 120) return '#60d060'
  if (val >= 90) return '#80c040'
  if (val >= 60) return '#e0c030'
  if (val >= 40) return '#e08030'
  return '#e04040'
}
