<template>
  <div class="page">
    <div class="page-header">📊 野生最高 CP 表</div>
    <div style="font-size:12px;color:var(--sub);margin-bottom:12px">
      完美個體（紅三星）野生抓取最高 CP（Lv.20・15/15/15 IV）
    </div>

    <div class="search-wrap">
      <span class="search-icon">🔍</span>
      <input v-model="query" placeholder="搜尋寶可夢名稱…" @input="page = 1" />
    </div>

    <!-- 屬性 Filter -->
    <div class="chips">
      <button
        class="chip" :class="{ active: !typeFilter }"
        style="background:#555"
        @click="typeFilter = ''; page = 1"
      >全部</button>
      <button
        v-for="t in allTypes" :key="t"
        class="chip" :class="{ active: typeFilter === t }"
        :style="{ background: typeColors[t] }"
        @click="typeFilter = typeFilter === t ? '' : t; page = 1"
      >{{ typeNameZh[t] }}</button>
    </div>

    <div v-if="loading" class="center-msg">
      <div class="spinner"></div>
      <div>載入中…</div>
    </div>

    <template v-else>
      <div style="font-size:12px;color:var(--sub);margin-bottom:14px">
        共 {{ filtered.length }} 隻
      </div>

      <div v-for="p in paginated" :key="p.id" class="cp-card">
        <img
          :src="`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`"
          width="52" height="52" style="image-rendering:pixelated"
          @error="e => e.target.style.display='none'"
        />
        <div class="cp-card-info">
          <div class="cp-card-name">{{ p.zhName }}</div>
          <div style="font-size:10px;color:var(--sub);margin:1px 0">#{{ String(p.id).padStart(4,'0') }}</div>
          <div style="display:flex;gap:4px;flex-wrap:wrap">
            <span
              v-for="t in p.types" :key="t"
              class="type-badge"
              :style="{ background: typeColors[t], fontSize:'10px', padding:'2px 6px' }"
            >{{ typeNameZh[t] }}</span>
          </div>
        </div>
        <div class="cp-card-val">
          <div class="cp-label">紅三星 CP</div>
          <div class="cp-num" v-if="p.wildCP">{{ p.wildCP }}</div>
          <div class="cp-num" style="color:var(--sub);font-size:14px" v-else>無資料</div>
        </div>
      </div>

      <div v-if="filtered.length > pageSize * page" style="text-align:center;margin:16px 0">
        <button class="btn btn-sm" @click="page++">
          再載入更多（剩 {{ filtered.length - pageSize * page }} 隻）
        </button>
      </div>
      <div v-if="filtered.length === 0" class="center-msg">找不到符合條件的寶可夢</div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue'
import { typeNameZh, typeColors } from '../utils/typeData.js'

const query = ref('')
const typeFilter = ref('')
const page = ref(1)
const pageSize = 40

const loading = ref(true)
const allPokemon = ref([])

const goStats = inject('goStats')

const allTypes = [
  'normal','fire','water','electric','grass','ice','fighting','poison',
  'ground','flying','psychic','bug','rock','ghost','dragon','dark','steel','fairy'
]

// Lv.20 CPM = 野生遇到時的最高 CP（完美個體）
const CPM_LV20 = 0.5974

function calcWildCP(id) {
  const s = goStats.value?.[id]
  if (!s) return null
  return Math.max(10, Math.floor(
    (s.atk + 15) * Math.sqrt(s.def + 15) * Math.sqrt(s.sta + 15) * CPM_LV20 * CPM_LV20 / 10
  ))
}

const GQL = 'https://beta.pokeapi.co/graphql/v1beta'

async function loadPokemon() {
  const CACHE_KEY = 'poke_list_v2'
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
    const res = await fetch(GQL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `{
          pokemon_v2_pokemon(where: {is_default: {_eq: true}}, order_by: {id: asc}) {
            id
            name
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
    allPokemon.value = json.data.pokemon_v2_pokemon.map(p => ({
      id: p.id,
      apiName: p.name,
      zhName: p.pokemon_v2_pokemonspecy?.pokemon_v2_pokemonspeciesnames?.[0]?.name || p.name,
      types: p.pokemon_v2_pokemontypes.map(t => t.pokemon_v2_type.name),
    }))
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: allPokemon.value }))
  } catch (e) {
    console.error(e)
  }
  loading.value = false
}

const filtered = computed(() => {
  let list = allPokemon.value.map(p => ({
    ...p,
    wildCP: calcWildCP(p.id)
  }))
  if (query.value.trim()) {
    const q = query.value.trim().toLowerCase()
    list = list.filter(p => p.zhName.includes(query.value.trim()) || p.apiName.toLowerCase().includes(q))
  }
  if (typeFilter.value) {
    list = list.filter(p => p.types.includes(typeFilter.value))
  }
  return list.sort((a, b) => (b.wildCP ?? 0) - (a.wildCP ?? 0))
})

const paginated = computed(() => filtered.value.slice(0, pageSize * page.value))

loadPokemon()
</script>

<style scoped>
.cp-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 12px 14px;
  margin-bottom: 10px;
}

.cp-card-info {
  flex: 1;
  min-width: 0;
}

.cp-card-name {
  font-weight: 700;
  font-size: 15px;
  margin-bottom: 2px;
}

.cp-card-val {
  text-align: right;
  flex-shrink: 0;
}

.cp-label {
  font-size: 10px;
  color: var(--sub);
  margin-bottom: 2px;
}

.cp-num {
  font-size: 22px;
  font-weight: 800;
  color: var(--accent);
}
</style>
