<template>
  <div class="page">
    <div class="page-header">📊 滿百數值表</div>

    <div class="search-wrap">
      <span class="search-icon">🔍</span>
      <input v-model="query" placeholder="搜尋寶可夢名稱…" />
    </div>

    <!-- 屬性 Filter -->
    <div class="chips">
      <button
        class="chip"
        :class="{ active: !typeFilter }"
        :style="{ background: '#444', color: '#fff' }"
        @click="typeFilter = ''"
      >全部</button>
      <button
        v-for="t in allTypes" :key="t"
        class="chip"
        :class="{ active: typeFilter === t }"
        :style="{ background: typeColors[t] }"
        @click="typeFilter = typeFilter === t ? '' : t"
      >{{ typeNameZh[t] }}</button>
    </div>

    <div v-if="loading" class="center-msg">
      <div class="spinner"></div>
      <div>載入寶可夢資料中… ({{ loadProgress }})</div>
    </div>

    <template v-else>
      <div style="font-size:12px;color:var(--sub);margin-bottom:10px">
        共 {{ filtered.length }} 隻 ／ Lv.100（31 IV、0 EV、無性格加成）
      </div>

      <!-- Header -->
      <div class="stats-row header">
        <div class="name-col">名稱</div>
        <div class="num"><button class="sort-btn" @click="sortBy('hp')">HP{{ sortKey==='hp'?(sortAsc?'▲':'▼'):'' }}</button></div>
        <div class="num"><button class="sort-btn" @click="sortBy('attack')">攻{{ sortKey==='attack'?(sortAsc?'▲':'▼'):'' }}</button></div>
        <div class="num"><button class="sort-btn" @click="sortBy('defense')">防{{ sortKey==='defense'?(sortAsc?'▲':'▼'):'' }}</button></div>
        <div class="num"><button class="sort-btn" @click="sortBy('special-attack')">特攻{{ sortKey==='special-attack'?(sortAsc?'▲':'▼'):'' }}</button></div>
        <div class="num"><button class="sort-btn" @click="sortBy('special-defense')">特防{{ sortKey==='special-defense'?(sortAsc?'▲':'▼'):'' }}</button></div>
        <div class="num"><button class="sort-btn" @click="sortBy('speed')">速{{ sortKey==='speed'?(sortAsc?'▲':'▼'):'' }}</button></div>
        <div class="num"><button class="sort-btn" @click="sortBy('total')">總{{ sortKey==='total'?(sortAsc?'▲':'▼'):'' }}</button></div>
      </div>

      <div
        v-for="p in paginated" :key="p.id"
        class="stats-row"
      >
        <div class="name-col">
          <div style="font-weight:600;font-size:12px">{{ p.zhName }}</div>
          <div style="display:flex;gap:3px;margin-top:3px">
            <span
              v-for="t in p.types" :key="t"
              class="type-badge"
              :style="{ background: typeColors[t], fontSize:'9px', padding:'1px 5px' }"
            >{{ typeNameZh[t] }}</span>
          </div>
        </div>
        <div class="num" :style="{ color: statColor(p.lv100.hp) }">{{ p.lv100.hp }}</div>
        <div class="num" :style="{ color: statColor(p.lv100.attack) }">{{ p.lv100.attack }}</div>
        <div class="num" :style="{ color: statColor(p.lv100.defense) }">{{ p.lv100.defense }}</div>
        <div class="num" :style="{ color: statColor(p.lv100['special-attack']) }">{{ p.lv100['special-attack'] }}</div>
        <div class="num" :style="{ color: statColor(p.lv100['special-defense']) }">{{ p.lv100['special-defense'] }}</div>
        <div class="num" :style="{ color: statColor(p.lv100.speed) }">{{ p.lv100.speed }}</div>
        <div class="num" style="font-weight:700;color:var(--accent)">{{ p.total }}</div>
      </div>

      <!-- Load more -->
      <div v-if="filtered.length > pageSize * page" style="text-align:center;margin:16px 0">
        <button class="btn btn-sm" @click="page++">載入更多（{{ filtered.length - pageSize * page }} 隻）</button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue'
import { typeNameZh, typeColors, calcLv100Stat, statColor } from '../utils/typeData.js'

const query = ref('')
const typeFilter = ref('')
const sortKey = ref('total')
const sortAsc = ref(false)
const page = ref(1)
const pageSize = 60

const pokemonCacheReady = inject('pokemonCacheReady')

const loading = ref(true)
const loadProgress = ref('0 / ?')
const allPokemon = ref([])

const allTypes = [
  'normal','fire','water','electric','grass','ice','fighting','poison',
  'ground','flying','psychic','bug','rock','ghost','dragon','dark','steel','fairy'
]

const GQL = 'https://beta.pokeapi.co/graphql/v1beta'

async function loadStats() {
  const CACHE_KEY = 'poke_stats_v2'
  const CACHE_TTL = 86400000
  const cached = localStorage.getItem(CACHE_KEY)
  if (cached) {
    try {
      const { ts, data } = JSON.parse(cached)
      if (Date.now() - ts < CACHE_TTL) {
        allPokemon.value = data
        loading.value = false
        return
      }
    } catch {}
  }

  try {
    loadProgress.value = '查詢中…'
    const res = await fetch(GQL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `{
          pokemon_v2_pokemon(where: {is_default: {_eq: true}}, order_by: {id: asc}) {
            id
            name
            pokemon_v2_pokemonstats {
              base_stat
              pokemon_v2_stat { name }
            }
            pokemon_v2_pokemontypes(order_by: {slot: asc}) {
              pokemon_v2_type { name }
            }
            pokemon_v2_pokemonspecy {
              pokemon_v2_pokemonspeciesnames(where: {pokemon_v2_language: {name: {_eq: "zh-Hant"}}}) { name }
            }
          }
        }`
      })
    })
    const json = await res.json()
    const raw = json.data?.pokemon_v2_pokemon || []
    loadProgress.value = `處理 ${raw.length} 筆…`

    allPokemon.value = raw.map(p => {
      const stats = {}
      for (const s of p.pokemon_v2_pokemonstats) {
        stats[s.pokemon_v2_stat.name] = s.base_stat
      }
      const lv100 = {}
      for (const [k, v] of Object.entries(stats)) {
        lv100[k] = calcLv100Stat(v, k)
      }
      const total = Object.values(stats).reduce((a, b) => a + b, 0)
      return {
        id: p.id,
        apiName: p.name,
        zhName: p.pokemon_v2_pokemonspecy?.pokemon_v2_pokemonspeciesnames?.[0]?.name || p.name,
        types: p.pokemon_v2_pokemontypes.map(t => t.pokemon_v2_type.name),
        stats,
        lv100,
        total,
      }
    })

    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: allPokemon.value }))
  } catch (e) {
    console.error(e)
  }
  loading.value = false
}

function sortBy(key) {
  if (sortKey.value === key) sortAsc.value = !sortAsc.value
  else { sortKey.value = key; sortAsc.value = false }
  page.value = 1
}

const filtered = computed(() => {
  let list = allPokemon.value
  if (query.value.trim()) {
    const q = query.value.trim().toLowerCase()
    list = list.filter(p => p.zhName.includes(query.value.trim()) || p.apiName.toLowerCase().includes(q))
  }
  if (typeFilter.value) {
    list = list.filter(p => p.types.includes(typeFilter.value))
  }
  const key = sortKey.value
  return [...list].sort((a, b) => {
    const va = key === 'total' ? a.total : (a.lv100[key] || 0)
    const vb = key === 'total' ? b.total : (b.lv100[key] || 0)
    return sortAsc.value ? va - vb : vb - va
  })
})

const paginated = computed(() => filtered.value.slice(0, pageSize * page.value))

loadStats()
</script>
