<template>
  <div class="page">
    <div class="page-header">⚔️ 團戰推薦</div>

    <!-- Boss 搜尋 -->
    <div class="search-wrap" style="position:relative">
      <span class="search-icon">🔍</span>
      <input v-model="query" placeholder="輸入 Raid Boss 名稱（中文）…"
        @input="onInput" @keydown.enter="searchBoss"
        @keydown.down.prevent="moveAC(1)" @keydown.up.prevent="moveAC(-1)"
        @blur="() => setTimeout(() => showAC = false, 150)"
        @focus="showAC = suggestions.length > 0" />
      <div v-if="showAC && suggestions.length" class="autocomplete">
        <div v-for="(s, i) in suggestions" :key="s.apiName"
          class="autocomplete-item" :style="i === acIndex ? 'background:var(--border)' : ''"
          @click="selectSuggestion(s)">{{ s.zhName }}</div>
      </div>
    </div>
    <button class="btn" style="width:100%;margin-bottom:16px" @click="searchBoss">查詢</button>

    <!-- 載入 -->
    <div v-if="searching" class="center-msg">
      <div class="spinner"></div>
      <div>計算推薦隊伍中…</div>
    </div>

    <!-- 錯誤 -->
    <div v-else-if="error" class="center-msg" style="color:var(--accent2)">{{ error }}</div>

    <!-- 結果 -->
    <template v-else-if="boss">
      <!-- Boss card -->
      <div class="card" style="display:flex;align-items:center;gap:14px;margin-bottom:20px">
        <img
          :src="`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${boss.id}.png`"
          style="width:80px;height:80px;object-fit:contain;flex-shrink:0"
          @error="e => e.target.style.display='none'" />
        <div style="flex:1;min-width:0">
          <div style="font-size:11px;color:var(--sub);letter-spacing:.5px;margin-bottom:2px">RAID BOSS</div>
          <div style="font-size:20px;font-weight:800;margin-bottom:6px">{{ boss.zhName }}</div>
          <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:8px">
            <span v-for="t in boss.types" :key="t" class="type-badge" :style="{ background: typeColors[t] }">{{ typeNameZh[t] }}</span>
          </div>
          <div style="font-size:12px;color:var(--sub)">弱點屬性：
            <span v-for="w in weakToTheBoss" :key="w.type" style="display:inline-block;margin-left:4px;margin-top:3px">
              <span class="type-badge"
                :style="{ background: typeColors[w.type], fontSize:'11px', outline: w.double ? '2px solid #f0c040' : 'none', outlineOffset:'1px' }">
                {{ typeNameZh[w.type] }}{{ w.double ? ' ×2' : '' }}
              </span>
            </span>
          </div>
        </div>
      </div>

      <!-- 推薦隊伍 -->
      <div v-if="!goDataReady" class="center-msg">
        <div class="spinner"></div><div>GO 資料載入中…</div>
      </div>
      <template v-else>
        <div class="section-title">推薦攻略隊伍（共 {{ counters.length }} 隻）</div>
        <div class="raid-grid">
          <div v-for="(p, i) in counters" :key="p.id" class="counter-card">
            <div class="counter-rank">{{ i + 1 }}</div>
            <img
              :src="`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`"
              width="56" height="56" style="image-rendering:pixelated"
              @error="e => e.target.style.display='none'" />
            <div class="counter-name">{{ p.zhName }}</div>
            <div style="display:flex;gap:3px;flex-wrap:wrap;justify-content:center;margin-bottom:6px">
              <span v-for="t in p.types" :key="t" class="type-badge"
                :style="{ background: typeColors[t], fontSize:'10px', padding:'1px 5px' }">{{ typeNameZh[t] }}</span>
            </div>
            <!-- 屬性剋制標籤 -->
            <div v-if="p.isDoubleCounter" class="dmg-badge dmg-2x">×2 剋制</div>
            <div v-else-if="p.isCounter" class="dmg-badge dmg-eff">有效剋制</div>
            <!-- PVE 推薦招式 -->
            <div v-if="p.pveFast" class="counter-move">
              <span class="move-tag fast-tag" style="font-size:9px;padding:1px 4px">快速</span>
              <span style="font-size:11px">{{ zhMove(p.pveFast.name) }}</span>
            </div>
            <div v-if="p.pveCharged" class="counter-move">
              <span class="move-tag charged-tag" style="font-size:9px;padding:1px 4px">技能</span>
              <span style="font-size:11px">{{ zhMove(p.pveCharged.name) }}</span>
            </div>
          </div>
        </div>
      </template>
    </template>

    <!-- 空白狀態 -->
    <div v-else class="center-msg">
      <div style="font-size:42px;margin-bottom:12px">⚔️</div>
      <div>輸入 Raid Boss 查詢推薦攻略隊伍</div>
      <div style="font-size:12px;color:var(--sub);margin-top:6px">依屬性剋制 ＋ 招式 DPS 自動排序</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue'
import { typeNameZh, typeColors, typeWeaknesses } from '../utils/typeData.js'

const query = ref('')
const searching = ref(false)
const error = ref('')
const boss = ref(null)
const showAC = ref(false)
const acIndex = ref(-1)

const pokemonNameMap = inject('pokemonNameMap')
const allPokemonList = inject('allPokemonList')
const pokemonCacheReady = inject('pokemonCacheReady')
const goStats = inject('goStats')
const goFastMoves = inject('goFastMoves')
const goChargedMoves = inject('goChargedMoves')
const goPokemonMoves = inject('goPokemonMoves')
const goDataReady = inject('goDataReady')
const moveNameZh = inject('moveNameZh')

function zhMove(goName) {
  if (!goName) return ''
  const key1 = goName.toLowerCase().replace(/ /g, '-')
  const key2 = goName.toLowerCase().replace(/[\s-]/g, '')
  return moveNameZh.value[key1] || moveNameZh.value[key2] || goName
}

// ── Autocomplete ──
const suggestions = computed(() => {
  if (!query.value.trim() || !pokemonCacheReady.value) return []
  const q = query.value.trim().toLowerCase()
  return allPokemonList.value.filter(p =>
    p.zhName.includes(query.value.trim()) || p.apiName.includes(q)
  ).slice(0, 8)
})
function onInput() { showAC.value = true; acIndex.value = -1 }
function moveAC(dir) { acIndex.value = Math.max(-1, Math.min(suggestions.value.length - 1, acIndex.value + dir)) }
function selectSuggestion(s) { query.value = s.zhName; showAC.value = false; searchBoss() }

// ── Boss 查詢（全從快取，不需要 API call）──
function searchBoss() {
  showAC.value = false
  const q = query.value.trim()
  if (!q) return
  searching.value = true
  error.value = ''
  boss.value = null

  const match = allPokemonList.value.find(p =>
    p.zhName.includes(q) || p.apiName.toLowerCase().includes(q.toLowerCase()) || pokemonNameMap.value[q] === p.apiName
  )
  if (!match) {
    error.value = `找不到「${q}」`
  } else {
    boss.value = match
  }
  searching.value = false
}

// ── Boss 弱點 ──
const weakToTheBoss = computed(() => {
  if (!boss.value) return []
  const counts = {}
  for (const t of boss.value.types) {
    for (const w of typeWeaknesses[t] || []) {
      counts[w] = (counts[w] || 0) + 1
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([t, c]) => ({ type: t, double: c >= 2 }))
})

const weakTypes = computed(() => weakToTheBoss.value.map(w => w.type))

// ── PVE 最佳招式 ──
function getBestPveMoves(pokemonId, types) {
  const moveEntry = goPokemonMoves.value[pokemonId]
  if (!moveEntry) return {}
  const allFast = [...moveEntry.fast, ...moveEntry.eliteFast].map(n => goFastMoves.value[n]).filter(Boolean)
  const allCharged = [...moveEntry.charged, ...moveEntry.eliteCharged].map(n => goChargedMoves.value[n]).filter(Boolean)
  const stab = types.map(t => t.charAt(0).toUpperCase() + t.slice(1))
  const pveFastScore = m => ((m.power || 0) / ((m.duration || 1000) / 1000)) * (stab.includes(m.type) ? 1.2 : 1)
  const pveChargedScore = m => {
    const cost = Math.abs(m.energy_delta || 100)
    return (m.power || 0) * ((m.power || 0) / cost) * (stab.includes(m.type) ? 1.2 : 1)
  }
  return {
    fast: [...allFast].sort((a, b) => pveFastScore(b) - pveFastScore(a))[0] || null,
    charged: [...allCharged].sort((a, b) => pveChargedScore(b) - pveChargedScore(a))[0] || null,
  }
}

// ── 計算推薦隊伍 ──
const counters = computed(() => {
  if (!boss.value || !goDataReady.value || !allPokemonList.value.length) return []
  const wt = weakTypes.value
  const doubleWeak = weakToTheBoss.value.filter(w => w.double).map(w => w.type)

  const scored = allPokemonList.value
    .filter(p => p.id !== boss.value.id && goStats.value[p.id])
    .map(p => {
      const stat = goStats.value[p.id]

      // 屬性分數
      const doubleCount = p.types.filter(t => doubleWeak.includes(t)).length
      const singleCount = p.types.filter(t => wt.includes(t) && !doubleWeak.includes(t)).length
      const typeScore = 1.0 + doubleCount * 0.5 + singleCount * 0.25
      const isDoubleCounter = doubleCount > 0
      const isCounter = singleCount > 0 || isDoubleCounter

      // 招式分數
      const moveEntry = goPokemonMoves.value[p.id]
      let moveScore = 1.0
      if (moveEntry) {
        const allMoves = [
          ...moveEntry.fast.map(n => goFastMoves.value[n]),
          ...moveEntry.charged.map(n => goChargedMoves.value[n]),
          ...moveEntry.eliteFast.map(n => goFastMoves.value[n]),
          ...moveEntry.eliteCharged.map(n => goChargedMoves.value[n]),
        ].filter(Boolean)
        const hasStabEff = allMoves.some(m => {
          const mt = m.type?.toLowerCase()
          return mt && wt.includes(mt) && p.types.includes(mt)
        })
        const hasEff = allMoves.some(m => wt.includes(m.type?.toLowerCase()))
        if (hasStabEff) moveScore = 1.35
        else if (hasEff) moveScore = 1.12
      }

      const moves = getBestPveMoves(p.id, p.types)
      return {
        ...p,
        score: stat.atk * typeScore * moveScore,
        isDoubleCounter,
        isCounter,
        pveFast: moves.fast,
        pveCharged: moves.charged,
      }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 9)

  return scored
})
</script>

<style scoped>
.raid-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}
@media (min-width: 640px) {
  .raid-grid { grid-template-columns: repeat(3, 1fr); }
}

.counter-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  position: relative;
}

.counter-rank {
  position: absolute;
  top: 8px;
  left: 10px;
  font-size: 11px;
  font-weight: 800;
  color: var(--sub);
}

.counter-name {
  font-weight: 700;
  font-size: 13px;
  text-align: center;
  margin-top: 2px;
}

.dmg-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 10px;
  margin-bottom: 2px;
}
.dmg-2x { background: #f0c040; color: #1a1200; }
.dmg-eff { background: #3a8f3a; color: #fff; }

.counter-move {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--sub);
  width: 100%;
  justify-content: center;
  margin-top: 1px;
}

.move-tag { font-size: 9px; font-weight: 700; padding: 2px 4px; border-radius: 4px; flex-shrink: 0; }
.fast-tag { background: #2980ef; color: #fff; }
.charged-tag { background: #e62829; color: #fff; }
</style>
