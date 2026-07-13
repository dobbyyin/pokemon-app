<template>
  <div class="page" style="padding-left:8px;padding-right:8px">
    <div class="page-header" style="padding-left:4px">⚡ 寶可夢比較</div>

    <!-- 三欄 -->
    <div class="compare-grid">
      <div v-for="i in [0,1,2]" :key="i" class="compare-col">

        <!-- 搜尋 -->
        <div style="position:relative">
          <input
            class="col-input"
            v-model="queries[i]"
            :placeholder="`寶可夢 ${i+1}`"
            @input="onInput(i)"
            @keydown.enter="search(i)"
            @keydown.down.prevent="moveAC(i,1)"
            @keydown.up.prevent="moveAC(i,-1)"
            @blur="() => setTimeout(() => { showAC[i] = false }, 150)"
            @focus="showAC[i] = getSuggestions(i).length > 0"
          />
          <div v-if="showAC[i] && getSuggestions(i).length" class="col-autocomplete">
            <div
              v-for="(s, si) in getSuggestions(i)" :key="s.apiName"
              class="col-ac-item"
              :style="si === acIndex[i] ? 'background:var(--border)' : ''"
              @click="selectSuggestion(i, s)"
            >{{ s.zhName }}</div>
          </div>
        </div>

        <!-- 載入中 -->
        <div v-if="loading[i]" class="col-loading">
          <div class="spinner" style="width:24px;height:24px;border-width:2px;margin:12px auto 4px"></div>
        </div>

        <!-- 結果 -->
        <div v-else-if="results[i]" class="col-result">
          <!-- 頭部 -->
          <div class="col-header">
            <img
              :src="`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${results[i].id}.png`"
              width="56" height="56" style="image-rendering:pixelated"
              @error="e => e.target.style.display='none'"
            />
            <div>
              <div class="col-name">{{ results[i].zhName }}</div>
              <div style="font-size:10px;color:var(--sub)">#{{ String(results[i].id).padStart(4,'0') }}</div>
              <div style="display:flex;gap:3px;flex-wrap:wrap;margin-top:3px">
                <span
                  v-for="t in results[i].types" :key="t"
                  class="type-badge"
                  :style="{ background: typeColors[t], fontSize:'10px', padding:'2px 6px' }"
                >{{ typeNameZh[t] }}</span>
              </div>
            </div>
          </div>

          <!-- GO CP -->
          <div class="col-cp">
            <span class="col-cp-label">GO Lv.40 CP</span>
            <span class="col-cp-val">{{ results[i].cp ?? '—' }}</span>
          </div>

          <!-- PVP 招式 -->
          <div class="col-section-title">🏆 PVP 推薦</div>
          <div v-if="!goDataReady" class="col-sub">GO 資料載入中…</div>
          <template v-else>
            <div class="move-row" v-if="results[i].pvpFast">
              <span class="move-tag fast-tag">快</span>
              <span class="type-badge" :style="{background: typeColors[results[i].pvpFast.type?.toLowerCase()], fontSize:'9px', padding:'1px 4px'}">{{ typeNameZh[results[i].pvpFast.type?.toLowerCase()] }}</span>
              <span class="move-row-name">{{ results[i].pvpFast.name }}</span>
            </div>
            <div class="move-row" v-if="results[i].pvpCharged">
              <span class="move-tag charged-tag">技</span>
              <span class="type-badge" :style="{background: typeColors[results[i].pvpCharged.type?.toLowerCase()], fontSize:'9px', padding:'1px 4px'}">{{ typeNameZh[results[i].pvpCharged.type?.toLowerCase()] }}</span>
              <span class="move-row-name">{{ results[i].pvpCharged.name }}</span>
            </div>
            <div v-if="!results[i].pvpFast && !results[i].pvpCharged" class="col-sub">無資料</div>
          </template>

          <!-- PVE 招式 -->
          <div class="col-section-title">⚔️ PVE 推薦</div>
          <template v-if="goDataReady">
            <div class="move-row" v-if="results[i].pveFast">
              <span class="move-tag fast-tag">快</span>
              <span class="type-badge" :style="{background: typeColors[results[i].pveFast.type?.toLowerCase()], fontSize:'9px', padding:'1px 4px'}">{{ typeNameZh[results[i].pveFast.type?.toLowerCase()] }}</span>
              <span class="move-row-name">{{ results[i].pveFast.name }}</span>
            </div>
            <div class="move-row" v-if="results[i].pveCharged">
              <span class="move-tag charged-tag">技</span>
              <span class="type-badge" :style="{background: typeColors[results[i].pveCharged.type?.toLowerCase()], fontSize:'9px', padding:'1px 4px'}">{{ typeNameZh[results[i].pveCharged.type?.toLowerCase()] }}</span>
              <span class="move-row-name">{{ results[i].pveCharged.name }}</span>
            </div>
          </template>

          <!-- 屬性剋制 -->
          <div class="col-section-title">✅ 剋制屬性</div>
          <div style="display:flex;flex-wrap:wrap;gap:3px;margin-bottom:6px">
            <span
              v-for="t in getWeakToAttack(results[i].types)" :key="t"
              class="type-badge"
              :style="{ background: typeColors[t], fontSize:'10px', padding:'2px 5px' }"
            >{{ typeNameZh[t] }}</span>
            <span v-if="!getWeakToAttack(results[i].types).length" style="font-size:11px;color:var(--sub)">無</span>
          </div>

          <!-- 弱點 -->
          <div class="col-section-title">⚠️ 弱點屬性</div>
          <div style="display:flex;flex-wrap:wrap;gap:3px;margin-bottom:6px">
            <span
              v-for="t in getWeakDefense(results[i].types)" :key="t"
              class="type-badge"
              :style="{ background: typeColors[t], fontSize:'10px', padding:'2px 5px' }"
            >{{ typeNameZh[t] }}</span>
          </div>
        </div>

        <!-- 空白提示 -->
        <div v-else class="col-empty">輸入名稱<br/>按 Enter</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, inject } from 'vue'
import { typeNameZh, typeColors, typeAdvantages, typeWeaknesses } from '../utils/typeData.js'

const queries = ref(['', '', ''])
const results = ref([null, null, null])
const loading = ref([false, false, false])
const showAC = ref([false, false, false])
const acIndex = ref([-1, -1, -1])

const pokemonNameMap = inject('pokemonNameMap')
const allPokemonList = inject('allPokemonList')
const pokemonCacheReady = inject('pokemonCacheReady')
const goStats = inject('goStats')
const goFastMoves = inject('goFastMoves')
const goChargedMoves = inject('goChargedMoves')
const goPokemonMoves = inject('goPokemonMoves')
const goDataReady = inject('goDataReady')

const GQL = 'https://beta.pokeapi.co/graphql/v1beta'

function getSuggestions(i) {
  if (!queries.value[i].trim() || !pokemonCacheReady.value) return []
  const q = queries.value[i].trim().toLowerCase()
  return allPokemonList.value
    .filter(p => p.zhName.includes(queries.value[i].trim()) || p.apiName.includes(q))
    .slice(0, 6)
}

function onInput(i) {
  showAC.value[i] = true
  acIndex.value[i] = -1
}

function moveAC(i, dir) {
  acIndex.value[i] = Math.max(-1, Math.min(getSuggestions(i).length - 1, acIndex.value[i] + dir))
}

function selectSuggestion(i, s) {
  queries.value[i] = s.zhName
  showAC.value[i] = false
  search(i)
}

function calcCP(id) {
  const s = goStats.value[id]
  if (!s) return null
  const cpm = 0.7903
  return Math.max(10, Math.floor((s.atk + 15) * Math.sqrt(s.def + 15) * Math.sqrt(s.sta + 15) * cpm * cpm / 10))
}

function getBestMoves(pokemonId, types) {
  const moveEntry = goPokemonMoves.value[pokemonId]
  if (!moveEntry) return {}

  const allFastNames = [...moveEntry.fast, ...moveEntry.eliteFast]
  const allChargedNames = [...moveEntry.charged, ...moveEntry.eliteCharged]

  const fastMoves = allFastNames.map(n => goFastMoves.value[n]).filter(Boolean)
  const chargedMoves = allChargedNames.map(n => goChargedMoves.value[n]).filter(Boolean)

  const stab = types.map(t => t.charAt(0).toUpperCase() + t.slice(1))

  // PVP scoring
  const pvpFastScore = m => {
    const turns = Math.ceil((m.duration || 1000) / 500)
    const dpt = (m.power || 0) / turns
    const ept = (m.energy_delta || 0) / turns
    const stabBonus = stab.includes(m.type) ? 1.2 : 1
    return (dpt * 3 + ept * 3.5) * stabBonus
  }
  const pvpChargedScore = m => {
    const cost = Math.abs(m.energy_delta || 100)
    const dpe = (m.power || 0) / cost
    const stabBonus = stab.includes(m.type) ? 1.2 : 1
    return dpe * stabBonus
  }

  // PVE scoring
  const pveFastScore = m => {
    const dps = (m.power || 0) / ((m.duration || 1000) / 1000)
    const stabBonus = stab.includes(m.type) ? 1.2 : 1
    return dps * stabBonus
  }
  const pveChargedScore = m => {
    const cost = Math.abs(m.energy_delta || 100)
    const dpe = (m.power || 0) / cost
    const stabBonus = stab.includes(m.type) ? 1.2 : 1
    return m.power * dpe * stabBonus
  }

  const sortedPvpFast = [...fastMoves].sort((a, b) => pvpFastScore(b) - pvpFastScore(a))
  const sortedPvpCharged = [...chargedMoves].sort((a, b) => pvpChargedScore(b) - pvpChargedScore(a))
  const sortedPveFast = [...fastMoves].sort((a, b) => pveFastScore(b) - pveFastScore(a))
  const sortedPveCharged = [...chargedMoves].sort((a, b) => pveChargedScore(b) - pveChargedScore(a))

  return {
    pvpFast: sortedPvpFast[0] || null,
    pvpCharged: sortedPvpCharged[0] || null,
    pveFast: sortedPveFast[0] || null,
    pveCharged: sortedPveCharged[0] || null,
  }
}

async function search(i) {
  showAC.value[i] = false
  const q = queries.value[i].trim()
  if (!q) return

  let apiName = pokemonNameMap.value[q]
  if (!apiName) {
    const match = allPokemonList.value.find(p =>
      p.zhName.includes(q) || p.apiName.toLowerCase().includes(q.toLowerCase())
    )
    if (!match) { results.value[i] = { error: `找不到「${q}」` }; return }
    apiName = match.apiName
  }

  loading.value[i] = true
  results.value[i] = null

  try {
    const res = await fetch(GQL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `query($name: String!) {
          pokemon_v2_pokemon(where: {name: {_eq: $name}}) {
            id
            pokemon_v2_pokemontypes(order_by: {slot: asc}) { pokemon_v2_type { name } }
            pokemon_v2_pokemonspecy {
              pokemon_v2_pokemonspeciesnames(where: {pokemon_v2_language: {name: {_eq: "zh-Hant"}}}) { name }
            }
          }
        }`,
        variables: { name: apiName }
      })
    })
    const json = await res.json()
    const p = json.data?.pokemon_v2_pokemon?.[0]
    if (!p) { results.value[i] = { error: '查無資料' }; return }

    const types = p.pokemon_v2_pokemontypes.map(t => t.pokemon_v2_type.name)
    const zhName = p.pokemon_v2_pokemonspecy?.pokemon_v2_pokemonspeciesnames?.[0]?.name || apiName
    const cp = calcCP(p.id)
    const moves = goDataReady.value ? getBestMoves(p.id, types) : {}

    results.value[i] = { id: p.id, zhName, types, cp, ...moves }
  } catch (e) {
    results.value[i] = { error: '查詢失敗' }
    console.error(e)
  } finally {
    loading.value[i] = false
  }
}

function getWeakToAttack(types) {
  const set = new Set()
  types.forEach(t => (typeAdvantages[t] || []).forEach(w => set.add(w)))
  return [...set]
}

function getWeakDefense(types) {
  const set = new Set()
  types.forEach(t => (typeWeaknesses[t] || []).forEach(w => set.add(w)))
  return [...set]
}
</script>

<style scoped>
.compare-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.compare-col {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.col-input {
  width: 100%;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 8px 10px;
  color: var(--text);
  font-size: 13px;
  outline: none;
}
.col-input:focus { border-color: var(--accent); }
.col-input::placeholder { color: var(--sub); font-size: 12px; }

.col-autocomplete {
  position: absolute;
  top: calc(100% + 2px);
  left: 0; right: 0;
  background: var(--card2, #1e1e38);
  border: 1px solid var(--border);
  border-radius: 10px;
  max-height: 180px;
  overflow-y: auto;
  z-index: 50;
}
.col-ac-item {
  padding: 8px 12px;
  font-size: 13px;
  cursor: pointer;
}
.col-ac-item:hover { background: var(--border); }

.col-result {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 10px 8px;
}

.col-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.col-name { font-weight: 700; font-size: 13px; line-height: 1.2; }

.col-cp {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--surface);
  border-radius: 8px;
  padding: 6px 10px;
  margin-bottom: 8px;
}
.col-cp-label { font-size: 10px; color: var(--sub); }
.col-cp-val { font-size: 18px; font-weight: 800; color: var(--accent); }

.col-section-title {
  font-size: 10px;
  font-weight: 700;
  color: var(--sub);
  letter-spacing: .5px;
  text-transform: uppercase;
  margin: 6px 0 4px;
}

.move-row {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
}
.move-tag {
  font-size: 9px;
  font-weight: 700;
  padding: 2px 4px;
  border-radius: 4px;
  flex-shrink: 0;
}
.fast-tag { background: #2980ef; color: #fff; }
.charged-tag { background: #e62829; color: #fff; }
.move-row-name { font-size: 11px; color: var(--text); flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.col-empty {
  text-align: center;
  color: var(--sub);
  font-size: 12px;
  padding: 20px 4px;
  background: var(--card);
  border: 1px dashed var(--border);
  border-radius: 12px;
  line-height: 1.6;
}

.col-loading {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
  text-align: center;
}

.col-sub { font-size: 11px; color: var(--sub); }
</style>
