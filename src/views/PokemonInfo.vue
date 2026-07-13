<template>
  <div class="page">
    <!-- ─── 比較模式 ─── -->
    <template v-if="compareMode">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
        <button class="btn btn-sm" style="background:var(--card);color:var(--text);border:1px solid var(--border)" @click="compareMode = false">← 返回</button>
        <span style="font-size:16px;font-weight:700">比較</span>
      </div>

      <div class="compare-grid">
        <div v-for="(p, ci) in paddedCompare" :key="ci" class="compare-col">
          <template v-if="p">
            <div class="col-header">
              <img :src="`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`"
                width="52" height="52" style="image-rendering:pixelated"
                @error="e => e.target.style.display='none'" />
              <div>
                <div class="col-name">{{ p.zhName }}</div>
                <div style="font-size:10px;color:var(--sub)">#{{ String(p.id).padStart(4,'0') }}</div>
                <div style="display:flex;gap:3px;flex-wrap:wrap;margin-top:3px">
                  <span v-for="t in p.types" :key="t" class="type-badge"
                    :style="{ background: typeColors[t], fontSize:'10px', padding:'2px 6px' }">{{ typeNameZh[t] }}</span>
                </div>
              </div>
            </div>

            <div class="col-cp">
              <span class="col-cp-label">紅三星 CP</span>
              <span class="col-cp-val">{{ p.cp ?? '—' }}</span>
            </div>

            <div class="col-section-title">🏆 PVP</div>
            <div class="move-row" v-if="p.pvpFast">
              <span class="move-tag fast-tag">快</span>
              <span class="type-badge" :style="{background: typeColors[p.pvpFast.type?.toLowerCase()], fontSize:'9px', padding:'1px 4px'}">{{ typeNameZh[p.pvpFast.type?.toLowerCase()] }}</span>
              <span class="move-row-name">{{ p.pvpFast.name }}</span>
            </div>
            <div class="move-row" v-if="p.pvpCharged">
              <span class="move-tag charged-tag">技</span>
              <span class="type-badge" :style="{background: typeColors[p.pvpCharged.type?.toLowerCase()], fontSize:'9px', padding:'1px 4px'}">{{ typeNameZh[p.pvpCharged.type?.toLowerCase()] }}</span>
              <span class="move-row-name">{{ p.pvpCharged.name }}</span>
            </div>

            <div class="col-section-title">⚔️ PVE</div>
            <div class="move-row" v-if="p.pveFast">
              <span class="move-tag fast-tag">快</span>
              <span class="type-badge" :style="{background: typeColors[p.pveFast.type?.toLowerCase()], fontSize:'9px', padding:'1px 4px'}">{{ typeNameZh[p.pveFast.type?.toLowerCase()] }}</span>
              <span class="move-row-name">{{ p.pveFast.name }}</span>
            </div>
            <div class="move-row" v-if="p.pveCharged">
              <span class="move-tag charged-tag">技</span>
              <span class="type-badge" :style="{background: typeColors[p.pveCharged.type?.toLowerCase()], fontSize:'9px', padding:'1px 4px'}">{{ typeNameZh[p.pveCharged.type?.toLowerCase()] }}</span>
              <span class="move-row-name">{{ p.pveCharged.name }}</span>
            </div>

            <div class="col-section-title">✅ 剋制</div>
            <div style="display:flex;flex-wrap:wrap;gap:3px;margin-bottom:6px">
              <span v-for="t in getWeakToAttack(p.types)" :key="t" class="type-badge"
                :style="{ background: typeColors[t], fontSize:'10px', padding:'2px 5px' }">{{ typeNameZh[t] }}</span>
              <span v-if="!getWeakToAttack(p.types).length" style="font-size:11px;color:var(--sub)">無</span>
            </div>

            <div class="col-section-title">⚠️ 弱點</div>
            <div style="display:flex;flex-wrap:wrap;gap:3px">
              <span v-for="t in getWeakDefense(p.types)" :key="t" class="type-badge"
                :style="{ background: typeColors[t], fontSize:'10px', padding:'2px 5px' }">{{ typeNameZh[t] }}</span>
            </div>
          </template>

          <div v-else class="col-empty">—</div>
        </div>
      </div>
    </template>

    <!-- ─── 搜尋模式 ─── -->
    <template v-else>
      <div class="page-header">⚡ 寶可夢查詢</div>

      <!-- 搜尋框 -->
      <div class="search-wrap" style="position:relative">
        <span class="search-icon">🔍</span>
        <input v-model="query" placeholder="輸入寶可夢名稱（中文）…"
          @input="onInput" @keydown.enter="search"
          @keydown.down.prevent="moveAC(1)" @keydown.up.prevent="moveAC(-1)"
          @blur="() => setTimeout(() => showAC = false, 150)"
          @focus="showAC = suggestions.length > 0" />
        <div v-if="showAC && suggestions.length" class="autocomplete">
          <div v-for="(s, i) in suggestions" :key="s.apiName" class="autocomplete-item"
            :style="i === acIndex ? 'background:var(--border)' : ''"
            @click="selectSuggestion(s)">{{ s.zhName }}</div>
        </div>
      </div>
      <button class="btn" style="width:100%;margin-bottom:12px" @click="search">查詢</button>

      <!-- 比較列 -->
      <div v-if="compareList.length > 0" class="compare-bar">
        <div class="compare-bar-slots">
          <div v-for="p in compareList" :key="p.id" class="cbar-slot">
            <img :src="`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`"
              width="36" height="36" style="image-rendering:pixelated" />
            <div style="font-size:10px;color:var(--text);text-align:center;max-width:50px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ p.zhName }}</div>
            <button class="cbar-remove" @click="removeFromCompare(p.id)">✕</button>
          </div>
          <div v-for="i in (3 - compareList.length)" :key="`e${i}`" class="cbar-empty">
            <div style="font-size:18px;color:var(--border)">＋</div>
          </div>
        </div>
        <button class="btn" :disabled="compareList.length < 2" @click="compareMode = true"
          style="flex-shrink:0;font-size:13px;padding:10px 14px">
          比較 →
        </button>
      </div>

      <!-- 載入中 -->
      <div v-if="searching" class="center-msg">
        <div class="spinner"></div><div>查詢中…</div>
      </div>
      <div v-else-if="error" class="center-msg" style="color:var(--accent2)">{{ error }}</div>

      <!-- 結果 -->
      <template v-else-if="result">
        <!-- Header card -->
        <div class="card" style="position:relative;text-align:center">
          <!-- Checkbox toggle -->
          <label class="compare-check" :class="{ selected: isInCompare(result.id) }">
            <input type="checkbox" style="display:none"
              :checked="isInCompare(result.id)"
              @change="toggleCompare(result)" />
            <span>{{ isInCompare(result.id) ? '☑ 已選' : '☐ 加入比較' }}</span>
          </label>

          <img :src="`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${result.id}.png`"
            style="width:110px;height:110px;object-fit:contain"
            @error="e => e.target.style.display='none'" />
          <div style="font-size:22px;font-weight:800;margin:8px 0 4px">{{ result.zhName }}</div>
          <div style="color:var(--sub);font-size:13px;margin-bottom:10px">#{{ String(result.id).padStart(4,'0') }}</div>
          <div style="display:flex;gap:8px;justify-content:center;margin-bottom:12px">
            <span v-for="t in result.types" :key="t" class="type-badge" :style="{ background: typeColors[t] }">{{ typeNameZh[t] }}</span>
          </div>

          <!-- GO CP -->
          <div style="display:inline-flex;align-items:center;gap:8px;background:var(--surface);border-radius:10px;padding:8px 16px">
            <span style="font-size:12px;color:var(--sub)">紅三星 CP</span>
            <span style="font-size:22px;font-weight:800;color:var(--accent)">{{ result.cp ?? '—' }}</span>
          </div>
        </div>

        <!-- PVP -->
        <div class="section-title">🏆 PVP 推薦招式</div>
        <template v-if="goDataReady">
          <div v-if="result.pvpFast || result.pvpCharged">
            <div v-if="result.pvpFast" class="move-card">
              <span class="move-tag fast-tag" style="font-size:11px;padding:3px 8px">快速技</span>
              <span class="type-badge" :style="{background: typeColors[result.pvpFast.type?.toLowerCase()]}">{{ typeNameZh[result.pvpFast.type?.toLowerCase()] }}</span>
              <div style="flex:1">
                <div class="move-name">{{ result.pvpFast.name }}</div>
                <div class="move-info">威力 {{ result.pvpFast.power }} ／ 能量 +{{ result.pvpFast.energy_delta }} ／ {{ result.pvpFast.duration }}ms</div>
              </div>
            </div>
            <div v-if="result.pvpCharged" class="move-card">
              <span class="move-tag charged-tag" style="font-size:11px;padding:3px 8px">技能技</span>
              <span class="type-badge" :style="{background: typeColors[result.pvpCharged.type?.toLowerCase()]}">{{ typeNameZh[result.pvpCharged.type?.toLowerCase()] }}</span>
              <div style="flex:1">
                <div class="move-name">{{ result.pvpCharged.name }}</div>
                <div class="move-info">威力 {{ result.pvpCharged.power }} ／ 消耗 {{ Math.abs(result.pvpCharged.energy_delta) }} 能量</div>
              </div>
            </div>
          </div>
          <div v-else class="center-msg" style="padding:8px 0;font-size:13px">無 GO 招式資料</div>
        </template>
        <div v-else class="center-msg" style="padding:8px 0;font-size:13px;color:var(--sub)">GO 資料載入中…</div>

        <!-- PVE -->
        <div class="section-title">⚔️ PVE 推薦招式（Raid）</div>
        <template v-if="goDataReady">
          <div v-if="result.pveFast || result.pveCharged">
            <div v-if="result.pveFast" class="move-card">
              <span class="move-tag fast-tag" style="font-size:11px;padding:3px 8px">快速技</span>
              <span class="type-badge" :style="{background: typeColors[result.pveFast.type?.toLowerCase()]}">{{ typeNameZh[result.pveFast.type?.toLowerCase()] }}</span>
              <div style="flex:1">
                <div class="move-name">{{ result.pveFast.name }}</div>
                <div class="move-info">威力 {{ result.pveFast.power }} ／ {{ result.pveFast.duration }}ms</div>
              </div>
            </div>
            <div v-if="result.pveCharged" class="move-card">
              <span class="move-tag charged-tag" style="font-size:11px;padding:3px 8px">技能技</span>
              <span class="type-badge" :style="{background: typeColors[result.pveCharged.type?.toLowerCase()]}">{{ typeNameZh[result.pveCharged.type?.toLowerCase()] }}</span>
              <div style="flex:1">
                <div class="move-name">{{ result.pveCharged.name }}</div>
                <div class="move-info">威力 {{ result.pveCharged.power }} ／ 消耗 {{ Math.abs(result.pveCharged.energy_delta) }} 能量</div>
              </div>
            </div>
          </div>
        </template>

        <!-- 剋制 -->
        <div class="section-title">✅ 適合攻擊的寶可夢</div>
        <div style="margin-bottom:8px;font-size:12px;color:var(--sub)">
          弱點屬性：
          <span v-for="t in weakToAttack" :key="t">
            <span class="type-badge" :style="{ background: typeColors[t], fontSize:'11px', marginLeft:'4px' }">{{ typeNameZh[t] }}</span>
          </span>
        </div>
        <div class="poke-mini-list">
          <div v-for="p in goodTargets.slice(0, 10)" :key="p.id" class="poke-mini">
            <img :src="`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`"
              width="32" height="32" style="image-rendering:pixelated" />
            <div>
              <div style="font-weight:600;font-size:13px">{{ p.zhName }}</div>
              <div style="display:flex;gap:4px;margin-top:2px">
                <span v-for="t in p.types" :key="t" class="type-badge" :style="{ background: typeColors[t], fontSize:'10px' }">{{ typeNameZh[t] }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 弱點 -->
        <div class="section-title">⚠️ 最怕的寶可夢</div>
        <div style="margin-bottom:8px;font-size:12px;color:var(--sub)">
          剋制屬性：
          <span v-for="t in weakDefense" :key="t">
            <span class="type-badge" :style="{ background: typeColors[t], fontSize:'11px', marginLeft:'4px' }">{{ typeNameZh[t] }}</span>
          </span>
        </div>
        <div class="poke-mini-list" style="margin-bottom:16px">
          <div v-for="p in dangerTargets.slice(0, 10)" :key="p.id" class="poke-mini">
            <img :src="`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`"
              width="32" height="32" style="image-rendering:pixelated" />
            <div>
              <div style="font-weight:600;font-size:13px">{{ p.zhName }}</div>
              <div style="display:flex;gap:4px;margin-top:2px">
                <span v-for="t in p.types" :key="t" class="type-badge" :style="{ background: typeColors[t], fontSize:'10px' }">{{ typeNameZh[t] }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>

      <div v-else class="center-msg">
        <div style="font-size:40px;margin-bottom:12px">⚡</div>
        <div>輸入寶可夢名稱查詢詳細資料</div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue'
import { typeNameZh, typeColors, typeAdvantages, typeWeaknesses } from '../utils/typeData.js'

const query = ref('')
const searching = ref(false)
const error = ref('')
const result = ref(null)
const showAC = ref(false)
const acIndex = ref(-1)
const compareList = ref([])
const compareMode = ref(false)

const pokemonNameMap = inject('pokemonNameMap')
const allPokemonList = inject('allPokemonList')
const pokemonCacheReady = inject('pokemonCacheReady')
const goStats = inject('goStats')
const goFastMoves = inject('goFastMoves')
const goChargedMoves = inject('goChargedMoves')
const goPokemonMoves = inject('goPokemonMoves')
const goDataReady = inject('goDataReady')

const GQL = 'https://beta.pokeapi.co/graphql/v1beta'

const suggestions = computed(() => {
  if (!query.value.trim() || !pokemonCacheReady.value) return []
  const q = query.value.trim().toLowerCase()
  return allPokemonList.value.filter(p =>
    p.zhName.includes(query.value.trim()) || p.apiName.includes(q)
  ).slice(0, 8)
})

function onInput() { showAC.value = true; acIndex.value = -1 }
function moveAC(dir) {
  acIndex.value = Math.max(-1, Math.min(suggestions.value.length - 1, acIndex.value + dir))
}
function selectSuggestion(s) { query.value = s.zhName; showAC.value = false; search() }

function calcCP(id) {
  const s = goStats.value[id]
  if (!s) return null
  const cpm = 0.5974 // Lv.20 野生抓取最高 CP（紅三星）
  return Math.max(10, Math.floor((s.atk + 15) * Math.sqrt(s.def + 15) * Math.sqrt(s.sta + 15) * cpm * cpm / 10))
}

function getBestMoves(pokemonId, types) {
  const moveEntry = goPokemonMoves.value[pokemonId]
  if (!moveEntry) return {}
  const allFast = [...moveEntry.fast, ...moveEntry.eliteFast].map(n => goFastMoves.value[n]).filter(Boolean)
  const allCharged = [...moveEntry.charged, ...moveEntry.eliteCharged].map(n => goChargedMoves.value[n]).filter(Boolean)
  const stab = types.map(t => t.charAt(0).toUpperCase() + t.slice(1))

  const pvpFastScore = m => {
    const turns = Math.ceil((m.duration || 1000) / 500)
    return ((m.power || 0) / turns * 3 + (m.energy_delta || 0) / turns * 3.5) * (stab.includes(m.type) ? 1.2 : 1)
  }
  const pvpChargedScore = m => {
    const cost = Math.abs(m.energy_delta || 100)
    return ((m.power || 0) / cost) * (stab.includes(m.type) ? 1.2 : 1)
  }
  const pveFastScore = m => {
    return ((m.power || 0) / ((m.duration || 1000) / 1000)) * (stab.includes(m.type) ? 1.2 : 1)
  }
  const pveChargedScore = m => {
    const cost = Math.abs(m.energy_delta || 100)
    return (m.power || 0) * ((m.power || 0) / cost) * (stab.includes(m.type) ? 1.2 : 1)
  }

  return {
    pvpFast: [...allFast].sort((a, b) => pvpFastScore(b) - pvpFastScore(a))[0] || null,
    pvpCharged: [...allCharged].sort((a, b) => pvpChargedScore(b) - pvpChargedScore(a))[0] || null,
    pveFast: [...allFast].sort((a, b) => pveFastScore(b) - pveFastScore(a))[0] || null,
    pveCharged: [...allCharged].sort((a, b) => pveChargedScore(b) - pveChargedScore(a))[0] || null,
  }
}

async function search() {
  showAC.value = false
  const q = query.value.trim()
  if (!q) return
  let apiName = pokemonNameMap.value[q]
  if (!apiName) {
    const match = allPokemonList.value.find(p =>
      p.zhName.includes(q) || p.apiName.toLowerCase().includes(q.toLowerCase())
    )
    if (!match) { error.value = `找不到「${q}」`; result.value = null; return }
    apiName = match.apiName
  }
  searching.value = true; error.value = ''; result.value = null
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
    if (!p) { error.value = '查無資料'; return }
    const types = p.pokemon_v2_pokemontypes.map(t => t.pokemon_v2_type.name)
    const zhName = p.pokemon_v2_pokemonspecy?.pokemon_v2_pokemonspeciesnames?.[0]?.name || apiName
    const cp = calcCP(p.id)
    const moves = goDataReady.value ? getBestMoves(p.id, types) : {}
    result.value = { id: p.id, zhName, types, cp, ...moves }
  } catch (e) {
    error.value = '查詢失敗'; console.error(e)
  } finally {
    searching.value = false
  }
}

// ── Compare ──
const isInCompare = id => compareList.value.some(p => p.id === id)

function toggleCompare(pokemon) {
  if (isInCompare(pokemon.id)) {
    compareList.value = compareList.value.filter(p => p.id !== pokemon.id)
  } else {
    if (compareList.value.length >= 3) return
    compareList.value.push({ ...pokemon })
  }
}

function removeFromCompare(id) {
  compareList.value = compareList.value.filter(p => p.id !== id)
  if (compareList.value.length === 0) compareMode.value = false
}

const paddedCompare = computed(() => {
  const arr = [...compareList.value]
  while (arr.length < 3) arr.push(null)
  return arr
})

// ── Type chart ──
const weakToAttack = computed(() => {
  if (!result.value) return []
  const set = new Set()
  result.value.types.forEach(t => (typeAdvantages[t] || []).forEach(w => set.add(w)))
  return [...set]
})
const goodTargets = computed(() => {
  if (!weakToAttack.value.length) return []
  return allPokemonList.value.filter(p => p.types.some(t => weakToAttack.value.includes(t))).slice(0, 15)
})
const weakDefense = computed(() => {
  if (!result.value) return []
  const set = new Set()
  result.value.types.forEach(t => (typeWeaknesses[t] || []).forEach(w => set.add(w)))
  return [...set]
})
const dangerTargets = computed(() => {
  if (!weakDefense.value.length) return []
  return allPokemonList.value.filter(p => p.types.some(t => weakDefense.value.includes(t))).slice(0, 15)
})

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
/* ─── Compare bar ─── */
.compare-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 10px 12px;
  margin-bottom: 14px;
}
.compare-bar-slots {
  display: flex;
  gap: 8px;
  flex: 1;
}
.cbar-slot {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  width: 52px;
}
.cbar-remove {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 16px;
  height: 16px;
  background: var(--accent2);
  color: #fff;
  border: none;
  border-radius: 50%;
  font-size: 9px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}
.cbar-empty {
  width: 52px;
  height: 52px;
  border: 2px dashed var(--border);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ─── Checkbox toggle ─── */
.compare-check {
  position: absolute;
  top: 12px;
  right: 12px;
  cursor: pointer;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 5px 10px;
  font-size: 12px;
  color: var(--sub);
  user-select: none;
  transition: all .15s;
}
.compare-check.selected {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

/* ─── Compare grid ─── */
.compare-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.compare-col {
  min-width: 0;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 10px 8px;
}
.col-empty {
  text-align: center;
  color: var(--border);
  font-size: 24px;
  padding: 40px 0;
}
.col-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}
.col-name { font-weight: 700; font-size: 12px; line-height: 1.2; }
.col-cp {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--surface);
  border-radius: 8px;
  padding: 5px 8px;
  margin-bottom: 8px;
}
.col-cp-label { font-size: 9px; color: var(--sub); }
.col-cp-val { font-size: 16px; font-weight: 800; color: var(--accent); }
.col-section-title {
  font-size: 9px; font-weight: 700; color: var(--sub);
  letter-spacing: .5px; text-transform: uppercase;
  margin: 6px 0 4px;
}
.move-row { display: flex; align-items: center; gap: 3px; margin-bottom: 4px; }
.move-tag { font-size: 9px; font-weight: 700; padding: 2px 4px; border-radius: 4px; flex-shrink: 0; }
.fast-tag { background: #2980ef; color: #fff; }
.charged-tag { background: #e62829; color: #fff; }
.move-row-name { font-size: 10px; color: var(--text); flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* ─── Move cards (search mode) ─── */
.move-card { background: var(--card2, #1e1e38); border: 1px solid var(--border); border-radius: 10px; padding: 10px 12px; margin-bottom: 8px; display: flex; align-items: center; gap: 10px; }
.move-name { font-weight: 600; font-size: 14px; }
.move-info { font-size: 12px; color: var(--sub); }
</style>
