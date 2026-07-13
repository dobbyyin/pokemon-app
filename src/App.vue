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

// Global Pokemon name cache: { zhName -> apiName, apiName -> zhName }
const pokemonNameMap = ref({})
const allPokemonList = ref([]) // [{id, apiName, zhName, types:[]}]
const pokemonCacheReady = ref(false)

provide('pokemonNameMap', pokemonNameMap)
provide('allPokemonList', allPokemonList)
provide('pokemonCacheReady', pokemonCacheReady)

const GQL = 'https://beta.pokeapi.co/graphql/v1beta'

async function gql(query, variables) {
  const res = await fetch(GQL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  })
  const json = await res.json()
  return json.data
}

async function loadPokemonCache() {
  const CACHE_KEY = 'poke_names_v2'
  const CACHE_TTL = 86400000 // 24h
  const cached = localStorage.getItem(CACHE_KEY)
  if (cached) {
    const { ts, data } = JSON.parse(cached)
    if (Date.now() - ts < CACHE_TTL) {
      allPokemonList.value = data
      buildNameMap()
      pokemonCacheReady.value = true
      return
    }
  }

  try {
    const data = await gql(`{
      pokemon_v2_pokemon(where: {is_default: {_eq: true}}, order_by: {id: asc}) {
        id
        name
        pokemon_v2_pokemontypes(order_by: {slot: asc}) {
          pokemon_v2_type { name }
        }
        pokemon_v2_pokemonspecy {
          pokemon_v2_pokemonspeciesnames(where: {pokemon_v2_language: {name: {_eq: "zh-Hant"}}}) {
            name
          }
        }
      }
    }`)

    allPokemonList.value = data.pokemon_v2_pokemon.map(p => ({
      id: p.id,
      apiName: p.name,
      zhName: p.pokemon_v2_pokemonspecy?.pokemon_v2_pokemonspeciesnames?.[0]?.name || p.name,
      types: p.pokemon_v2_pokemontypes.map(t => t.pokemon_v2_type.name),
    }))

    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: allPokemonList.value }))
    buildNameMap()
    pokemonCacheReady.value = true
  } catch (e) {
    console.error('Failed to load pokemon cache', e)
  }
}

function buildNameMap() {
  const map = {}
  for (const p of allPokemonList.value) {
    map[p.zhName] = p.apiName
    map[p.apiName] = p.apiName
  }
  pokemonNameMap.value = map
}

loadPokemonCache()
</script>
