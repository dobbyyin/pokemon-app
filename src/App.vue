<template>
  <div id="app">
    <component :is="views[activeTab]" />
    <nav class="bottom-nav">
      <button
        v-for="(tab, i) in tabs" :key="i"
        class="nav-btn" :class="{ active: activeTab === i }"
        @click="activeTab = i"
      >
        <span class="icon">{{ tab.icon }}</span>
        <span>{{ tab.label }}</span>
      </button>
    </nav>
  </div>
</template>

<script setup>
import { ref, provide } from 'vue'
import PokemonInfo from './views/PokemonInfo.vue'
import StatsTable from './views/StatsTable.vue'

const activeTab = ref(0)
const tabs = [
  { label: '寶可夢', icon: '⚡' },
  { label: '數值表', icon: '📊' },
]
const views = [PokemonInfo, StatsTable]

// ── 主系列快取 ──
const pokemonNameMap = ref({})
const allPokemonList = ref([])
const pokemonCacheReady = ref(false)

// ── GO 資料 ──
const goStats = ref({})        // id → {atk, def, sta}
const goFastMoves = ref({})    // name → {power, energyDelta, duration}
const goChargedMoves = ref({}) // name → {power, energyDelta}
const goPokemonMoves = ref({}) // id → {fast:[], charged:[], eliteFast:[], eliteCharged:[]}
const goDataReady = ref(false)
const moveNameZh = ref({})     // normalized-en-name → 中文招式名

provide('pokemonNameMap', pokemonNameMap)
provide('allPokemonList', allPokemonList)
provide('pokemonCacheReady', pokemonCacheReady)
provide('goStats', goStats)
provide('goFastMoves', goFastMoves)
provide('goChargedMoves', goChargedMoves)
provide('goPokemonMoves', goPokemonMoves)
provide('goDataReady', goDataReady)
provide('moveNameZh', moveNameZh)

const GQL = 'https://beta.pokeapi.co/graphql/v1beta'
const POGO = 'https://pogoapi.net/api/v1'

// ── 主系列快取 ──
async function loadPokemonCache() {
  const KEY = 'poke_names_v2', TTL = 86400000
  const cached = localStorage.getItem(KEY)
  if (cached) {
    try {
      const { ts, data } = JSON.parse(cached)
      if (Date.now() - ts < TTL) {
        allPokemonList.value = data
        buildNameMap()
        pokemonCacheReady.value = true
        return
      }
    } catch {}
  }
  try {
    const res = await fetch(GQL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: `{
        pokemon_v2_pokemon(where: {is_default: {_eq: true}}, order_by: {id: asc}) {
          id name
          pokemon_v2_pokemontypes(order_by: {slot: asc}) { pokemon_v2_type { name } }
          pokemon_v2_pokemonspecy {
            pokemon_v2_pokemonspeciesnames(where: {pokemon_v2_language: {name: {_eq: "zh-Hant"}}}) { name }
          }
        }
      }` })
    })
    const json = await res.json()
    allPokemonList.value = json.data.pokemon_v2_pokemon.map(p => ({
      id: p.id,
      apiName: p.name,
      zhName: p.pokemon_v2_pokemonspecy?.pokemon_v2_pokemonspeciesnames?.[0]?.name || p.name,
      types: p.pokemon_v2_pokemontypes.map(t => t.pokemon_v2_type.name),
    }))
    localStorage.setItem(KEY, JSON.stringify({ ts: Date.now(), data: allPokemonList.value }))
    buildNameMap()
    pokemonCacheReady.value = true
  } catch (e) { console.error(e) }
}

function buildNameMap() {
  const map = {}
  for (const p of allPokemonList.value) {
    map[p.zhName] = p.apiName
    map[p.apiName] = p.apiName
  }
  pokemonNameMap.value = map
}

// ── GO 資料 ──
async function loadGOData() {
  const KEY = 'poke_go_data_v1', TTL = 86400000
  const cached = localStorage.getItem(KEY)
  if (cached) {
    try {
      const { ts, data } = JSON.parse(cached)
      if (Date.now() - ts < TTL) {
        goStats.value = data.stats
        goFastMoves.value = data.fast
        goChargedMoves.value = data.charged
        goPokemonMoves.value = data.moves
        goDataReady.value = true
        return
      }
    } catch {}
  }
  try {
    const [statsRaw, fastRaw, chargedRaw, movesRaw] = await Promise.all([
      fetch(`${POGO}/pokemon_stats.json`).then(r => r.json()),
      fetch(`${POGO}/fast_moves.json`).then(r => r.json()),
      fetch(`${POGO}/charged_moves.json`).then(r => r.json()),
      fetch(`${POGO}/current_pokemon_moves.json`).then(r => r.json()),
    ])

    const stats = {}
    for (const s of statsRaw) {
      if (!stats[s.pokemon_id] || s.form === 'Normal') {
        stats[s.pokemon_id] = { atk: s.base_attack, def: s.base_defense, sta: s.base_stamina }
      }
    }

    const fast = {}
    for (const m of fastRaw) fast[m.name] = m

    const charged = {}
    for (const m of chargedRaw) charged[m.name] = m

    const moves = {}
    for (const p of movesRaw) {
      if (!moves[p.pokemon_id] || p.form === 'Normal') {
        moves[p.pokemon_id] = {
          fast: p.fast_moves || [],
          charged: p.charged_moves || [],
          eliteFast: p.elite_fast_moves || [],
          eliteCharged: p.elite_charged_moves || [],
        }
      }
    }

    goStats.value = stats
    goFastMoves.value = fast
    goChargedMoves.value = charged
    goPokemonMoves.value = moves
    goDataReady.value = true

    localStorage.setItem(KEY, JSON.stringify({ ts: Date.now(), data: { stats, fast, charged, moves } }))
  } catch (e) { console.error('GO data load failed', e) }
}

// ── 招式中文名對照表 ──
async function loadMoveNames() {
  const KEY = 'poke_moves_zh_v1', TTL = 86400000 * 7
  const cached = localStorage.getItem(KEY)
  if (cached) {
    try {
      const { ts, data } = JSON.parse(cached)
      if (Date.now() - ts < TTL) { moveNameZh.value = data; return }
    } catch {}
  }
  try {
    const res = await fetch(GQL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: `{
        pokemon_v2_move {
          name
          pokemon_v2_movenames(where: {pokemon_v2_language: {name: {_eq: "zh-Hant"}}}) { name }
        }
      }` })
    })
    const json = await res.json()
    const map = {}
    for (const m of json.data.pokemon_v2_move) {
      const zh = m.pokemon_v2_movenames[0]?.name
      if (zh) {
        map[m.name] = zh                          // e.g. "psycho-cut" → "神秘劍"
        map[m.name.replace(/-/g, '')] = zh        // e.g. "psychocut" → "神秘劍"
      }
    }
    moveNameZh.value = map
    localStorage.setItem(KEY, JSON.stringify({ ts: Date.now(), data: map }))
  } catch (e) { console.error('move names load failed', e) }
}

loadPokemonCache()
loadGOData()
loadMoveNames()
</script>
