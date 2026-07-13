<template>
  <div class="page">
    <div class="page-header">📊 滿百數值表</div>

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
        共 {{ filtered.length }} 隻　Lv.100 數值（31 IV・0 EV・無性格加成）
      </div>

      <div v-for="p in paginated" :key="p.id" class="poke-stat-card">
        <!-- 左側：圖 + 名稱 + 屬性 -->
        <div class="poke-stat-left">
          <img
            :src="`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`"
            width="56" height="56" style="image-rendering:pixelated"
            @error="e => e.target.style.display='none'"
          />
          <div>
            <div style="font-weight:700;font-size:15px">{{ p.zhName }}</div>
            <div style="font-size:11px;color:var(--sub);margin:2px 0">#{{ String(p.id).padStart(4,'0') }}</div>
            <div style="display:flex;gap:4px;flex-wrap:wrap">
              <span
                v-for="t in p.types" :key="t"
                class="type-badge"
                :style="{ background: typeColors[t], fontSize:'11px' }"
              >{{ typeNameZh[t] }}</span>
            </div>
          </div>
        </div>

        <!-- 右側：六項數值 -->
        <div class="poke-stat-bars">
          <!-- GO CP -->
          <div style="display:flex;align-items:center;justify-content:space-between;background:var(--surface);border-radius:8px;padding:5px 10px;margin-bottom:8px">
            <span style="font-size:11px;color:var(--sub)">GO Lv.40 CP</span>
            <span style="font-size:17px;font-weight:800;color:var(--accent)">{{ calcCP(p.id) ?? '—' }}</span>
          </div>

          <div v-for="s in statOrder" :key="s.key" class="stat-row">
            <span class="stat-label">{{ s.label }}</span>
            <span class="stat-val" :style="{ color: statColor(p.lv100[s.key]) }">{{ p.lv100[s.key] }}</span>
            <div class="stat-bar-bg">
              <div
                class="stat-bar-fill"
                :style="{
                  width: Math.min(100, p.lv100[s.key] / 4.1) + '%',
                  background: statColor(p.lv100[s.key])
                }"
              ></div>
            </div>
          </div>
          <div style="text-align:right;font-size:12px;color:var(--sub);margin-top:4px">
            總計 <strong style="color:var(--accent)">{{ p.total }}</strong>
          </div>
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
import { typeNameZh, typeColors, calcLv100Stat, statColor } from '../utils/typeData.js'

const query = ref('')
const typeFilter = ref('')
const page = ref(1)
const pageSize = 30

const loading = ref(true)
const allPokemon = ref([])

const goStats = inject('goStats')

function calcCP(id) {
  const s = goStats.value[id]
  if (!s) return null
  const cpm = 0.7903
  return Math.max(10, Math.floor((s.atk + 15) * Math.sqrt(s.def + 15) * Math.sqrt(s.sta + 15) * cpm * cpm / 10))
}

const allTypes = [
  'normal','fire','water','electric','grass','ice','fighting','poison',
  'ground','flying','psychic','bug','rock','ghost','dragon','dark','steel','fairy'
]

const statOrder = [
  { key: 'hp', label: 'HP' },
  { key: 'attack', label: '攻擊' },
  { key: 'defense', label: '防禦' },
  { key: 'special-attack', label: '特攻' },
  { key: 'special-defense', label: '特防' },
  { key: 'speed', label: '速度' },
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

const filtered = computed(() => {
  let list = allPokemon.value
  if (query.value.trim()) {
    const q = query.value.trim().toLowerCase()
    list = list.filter(p => p.zhName.includes(query.value.trim()) || p.apiName.toLowerCase().includes(q))
  }
  if (typeFilter.value) {
    list = list.filter(p => p.types.includes(typeFilter.value))
  }
  return list
})

const paginated = computed(() => filtered.value.slice(0, pageSize * page.value))

loadStats()
</script>

<style scoped>
.poke-stat-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 14px;
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.poke-stat-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.poke-stat-bars {
  width: 100%;
}

.stat-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 5px;
  font-size: 13px;
}

.stat-label {
  width: 40px;
  color: var(--sub);
  font-size: 12px;
  flex-shrink: 0;
}

.stat-val {
  width: 34px;
  text-align: right;
  font-weight: 700;
  flex-shrink: 0;
  font-size: 13px;
}

.stat-bar-bg {
  flex: 1;
  height: 7px;
  background: var(--border);
  border-radius: 4px;
  overflow: hidden;
}

.stat-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width .4s;
}
</style>
