<template>
  <div class="page">
    <div class="page-header">📊 野生 CP 表</div>
    <div style="font-size:12px;color:var(--sub);margin-bottom:12px">
      Lv.20 野生抓取 CP（100% 紅三星 ＋ 三種 98%）
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
        <!-- 左：圖 + 名稱 + 屬性 -->
        <div class="cp-card-left">
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
        </div>

        <!-- 右：四行 CP -->
        <div class="cp-grid" v-if="p.wildCP">
          <div class="cp-row top">
            <span class="cp-iv-label">🔴 100%</span>
            <span class="cp-val-big">{{ p.wildCP }}</span>
          </div>
          <div class="cp-divider"></div>
          <div class="cp-row">
            <span class="cp-iv-label">攻 14</span>
            <span class="cp-val">{{ p.cp98atk }}</span>
          </div>
          <div class="cp-row">
            <span class="cp-iv-label">防 14</span>
            <span class="cp-val">{{ p.cp98def }}</span>
          </div>
          <div class="cp-row">
            <span class="cp-iv-label">耐 14</span>
            <span class="cp-val">{{ p.cp98sta }}</span>
          </div>
        </div>
        <div v-else style="font-size:13px;color:var(--sub);padding:8px">無資料</div>
      </div>

      <!-- 進化時序 -->
      <div v-if="getEvoChain(p.id)" class="cp-evo">
        <template v-for="(stage, si) in getEvoChain(p.id)" :key="si">
          <span v-if="si > 0" class="cp-evo-arrow">→</span>
          <span v-for="ep in stage" :key="ep.id"
            class="cp-evo-name" :class="{ active: ep.id === p.id }">
            {{ ep.zhName }}
          </span>
        </template>
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
const getEvoChain = inject('getEvoChain')

const allTypes = [
  'normal','fire','water','electric','grass','ice','fighting','poison',
  'ground','flying','psychic','bug','rock','ghost','dragon','dark','steel','fairy'
]

const CPM_LV20 = 0.5974

function cp(id, ivAtk, ivDef, ivSta) {
  const s = goStats.value?.[id]
  if (!s) return null
  return Math.max(10, Math.floor(
    (s.atk + ivAtk) * Math.sqrt(s.def + ivDef) * Math.sqrt(s.sta + ivSta) * CPM_LV20 * CPM_LV20 / 10
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
    wildCP:  cp(p.id, 15, 15, 15),
    cp98atk: cp(p.id, 14, 15, 15),
    cp98def: cp(p.id, 15, 14, 15),
    cp98sta: cp(p.id, 15, 15, 14),
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
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 12px 14px 10px;
  margin-bottom: 10px;
}

.cp-card-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.cp-card-info { min-width: 0; }

.cp-card-name {
  font-weight: 700;
  font-size: 15px;
  margin-bottom: 2px;
}

/* ── CP 右欄 ── */
.cp-grid {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
  text-align: right;
  min-width: 90px;
}

.cp-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.cp-row.top { margin-bottom: 2px; }

.cp-iv-label {
  font-size: 10px;
  color: var(--sub);
  white-space: nowrap;
}

.cp-val-big {
  font-size: 22px;
  font-weight: 800;
  color: var(--accent);
}

.cp-val {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
}

.cp-divider {
  height: 1px;
  background: var(--border);
  margin: 2px 0;
}

/* ─── 進化時序 ─── */
.cp-evo {
  width: 100%;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 3px;
  padding-top: 8px;
  font-size: 11px;
  color: var(--sub);
  border-top: 1px solid var(--border);
  margin-top: 4px;
}
.cp-evo-arrow { color: var(--sub); font-size: 10px; }
.cp-evo-name { color: var(--sub); }
.cp-evo-name.active { color: var(--accent); font-weight: 700; }
</style>
