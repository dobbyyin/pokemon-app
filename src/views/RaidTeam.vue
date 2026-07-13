<template>
  <div class="page">
    <div class="page-header">⚔️ 團戰推薦</div>

    <!-- 模式切換 -->
    <div class="mode-tabs">
      <button :class="['mode-tab', raidMode === 'normal' && 'active']"
        @click="raidMode = 'normal'; boss = null; error = ''">普通團戰</button>
      <button :class="['mode-tab', raidMode === 'gmax' && 'active']"
        @click="raidMode = 'gmax'; boss = null; error = ''">⚡ 極巨化</button>
    </div>

    <!-- 普通：搜尋 -->
    <template v-if="raidMode === 'normal'">
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
    </template>

    <!-- 極巨化：下拉選單 -->
    <template v-else>
      <div class="gmax-wrap">
        <div style="font-size:12px;color:var(--sub);margin-bottom:8px">
          選擇極巨化 Boss（Gigantamax）
        </div>
        <select class="gmax-select" v-model="gmaxSelected" @change="selectGmax">
          <option value="">— 請選擇 —</option>
          <optgroup v-for="g in gmaxGroups" :key="g.label" :label="g.label">
            <option v-for="p in g.items" :key="p.id" :value="p.id">
              {{ p.zhName }}（{{ p.types.map(t => typeNameZh[t]).join('／') }}）
            </option>
          </optgroup>
        </select>
      </div>
    </template>

    <!-- 載入中 -->
    <div v-if="searching" class="center-msg">
      <div class="spinner"></div>
      <div>計算推薦隊伍中…</div>
    </div>

    <!-- 錯誤 -->
    <div v-else-if="error" class="center-msg" style="color:var(--accent2)">{{ error }}</div>

    <!-- 結果 -->
    <template v-else-if="boss">
      <!-- Boss card -->
      <div class="boss-card">
        <img
          :src="`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${boss.id}.png`"
          class="boss-art"
          @error="e => e.target.style.display='none'" />
        <div style="flex:1;min-width:0">
          <div class="boss-label">{{ raidMode === 'gmax' ? '⚡ 極巨化 BOSS' : 'RAID BOSS' }}</div>
          <div class="boss-name">{{ boss.zhName }}</div>
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
            <img :src="`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`"
              width="56" height="56" style="image-rendering:pixelated"
              @error="e => e.target.style.display='none'" />
            <div class="counter-name">{{ p.zhName }}</div>
            <div style="display:flex;gap:3px;flex-wrap:wrap;justify-content:center;margin-bottom:6px">
              <span v-for="t in p.types" :key="t" class="type-badge"
                :style="{ background: typeColors[t], fontSize:'10px', padding:'1px 5px' }">{{ typeNameZh[t] }}</span>
            </div>
            <div v-if="p.isDoubleCounter" class="dmg-badge dmg-2x">×2 剋制</div>
            <div v-else-if="p.isCounter" class="dmg-badge dmg-eff">有效剋制</div>
            <div v-if="p.pveFast" class="counter-move">
              <span class="move-tag fast-tag">快速</span>
              <span style="font-size:11px">{{ zhMove(p.pveFast.name) }}</span>
            </div>
            <div v-if="p.pveCharged" class="counter-move">
              <span class="move-tag charged-tag">技能</span>
              <span style="font-size:11px">{{ zhMove(p.pveCharged.name) }}</span>
            </div>
          </div>
        </div>

        <!-- 攻略 -->
        <div class="strategy-card">
          <div class="strategy-title">📋 攻略重點</div>

          <div class="strategy-row">
            <span class="strategy-label">推薦屬性</span>
            <span class="strategy-val">
              <span v-for="w in weakToTheBoss" :key="w.type" style="margin-right:4px">
                <span class="type-badge" :style="{ background: typeColors[w.type], fontSize:'11px' }">
                  {{ typeNameZh[w.type] }}{{ w.double ? ' ×2' : '' }}
                </span>
              </span>
            </span>
          </div>

          <div v-if="doubleWeakTypes.length" class="strategy-row warn">
            <span class="strategy-label">⚠️ 雙弱屬性</span>
            <span class="strategy-val">{{ doubleWeakTypes.map(t => typeNameZh[t]).join('、') }} 系造成雙倍傷害，優先使用</span>
          </div>

          <div class="strategy-row">
            <span class="strategy-label">推薦首選</span>
            <span class="strategy-val">{{ counters.slice(0, 3).map(p => p.zhName).join('、') }}</span>
          </div>

          <div class="strategy-row">
            <span class="strategy-label">招式策略</span>
            <span class="strategy-val">
              以
              <span v-for="w in weakToTheBoss.slice(0, 2)" :key="w.type">
                <span class="type-badge" :style="{ background: typeColors[w.type], fontSize:'11px' }">{{ typeNameZh[w.type] }}</span>
              </span>
              系 STAB 招式為主，快速技＋技能技皆須符合屬性
            </span>
          </div>

          <div v-if="raidMode === 'gmax'" class="strategy-row gmax-tip">
            <span class="strategy-label">⚡ 極巨化</span>
            <span class="strategy-val">極巨化團戰需先蓄能才能使用極巨化招式，建議備妥 Max 招式；守護者戰結束後可繼續挑戰</span>
          </div>

          <div class="strategy-row">
            <span class="strategy-label">一般建議</span>
            <span class="strategy-val">使用滿 IV 或高 IV 寶可夢、搭配天氣加成效果更佳；避免使用對 Boss 效果不佳的屬性</span>
          </div>
        </div>
      </template>
    </template>

    <!-- 空白狀態 -->
    <div v-else class="center-msg">
      <div style="font-size:42px;margin-bottom:12px">⚔️</div>
      <div>{{ raidMode === 'gmax' ? '選擇極巨化 Boss 查詢推薦隊伍' : '輸入 Raid Boss 查詢推薦攻略隊伍' }}</div>
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
const raidMode = ref('normal')
const gmaxSelected = ref('')

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

// ── 普通搜尋 ──
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
  if (!match) error.value = `找不到「${q}」`
  else boss.value = match
  searching.value = false
}

// ── 極巨化 Boss 清單 ──
// 以世代分組，IDs 為 national dex（is_default form）
const GMAX_GROUPS = [
  {
    label: '第一世代',
    ids: [3, 6, 9, 12, 25, 52, 68, 94, 99, 113, 131, 133, 143],
  },
  {
    label: '第五世代',
    ids: [569, 633],
  },
  {
    label: '第七世代',
    ids: [809],
  },
  {
    label: '第八世代（劍盾）',
    ids: [812, 815, 818, 823, 826, 834, 839, 841, 842, 844, 849, 851, 858, 861, 869, 879, 884, 892],
  },
]

const gmaxGroups = computed(() =>
  GMAX_GROUPS.map(g => ({
    label: g.label,
    items: g.ids.map(id => allPokemonList.value.find(p => p.id === id)).filter(Boolean),
  })).filter(g => g.items.length > 0)
)

function selectGmax() {
  boss.value = null
  if (!gmaxSelected.value) return
  const id = Number(gmaxSelected.value)
  boss.value = allPokemonList.value.find(p => p.id === id) || null
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
const doubleWeakTypes = computed(() => weakToTheBoss.value.filter(w => w.double).map(w => w.type))

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
const allGmaxIds = GMAX_GROUPS.flatMap(g => g.ids)

const counters = computed(() => {
  if (!boss.value || !goDataReady.value || !allPokemonList.value.length) return []
  const wt = weakTypes.value
  const doubleWeak = doubleWeakTypes.value

  // 極巨化模式：只從有極巨化的寶可夢中挑（才有 G-Max 招式可用）
  return allPokemonList.value
    .filter(p => p.id !== boss.value.id && goStats.value[p.id] &&
      (raidMode.value === 'normal' || allGmaxIds.includes(p.id))
    )
    .map(p => {
      const stat = goStats.value[p.id]
      const doubleCount = p.types.filter(t => doubleWeak.includes(t)).length
      const singleCount = p.types.filter(t => wt.includes(t) && !doubleWeak.includes(t)).length
      const typeScore = 1.0 + doubleCount * 0.5 + singleCount * 0.25
      const isDoubleCounter = doubleCount > 0
      const isCounter = singleCount > 0 || isDoubleCounter

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
})
</script>

<style scoped>
/* ── 模式切換 ── */
.mode-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  background: var(--surface);
  padding: 4px;
  border-radius: 12px;
}
.mode-tab {
  flex: 1;
  padding: 8px;
  border: none;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  background: transparent;
  color: var(--sub);
  transition: all .15s;
}
.mode-tab.active {
  background: var(--accent);
  color: #fff;
}

/* ── 極巨化選單 ── */
.gmax-wrap { margin-bottom: 16px; }
.gmax-select {
  width: 100%;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px 16px;
  color: var(--text);
  font-size: 14px;
  outline: none;
  cursor: pointer;
}
.gmax-select:focus { border-color: var(--accent); }
.gmax-select option, .gmax-select optgroup { background: #1a1a2e; color: var(--text); }

/* ── Boss card ── */
.boss-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 14px;
  margin-bottom: 20px;
}
.boss-art { width: 80px; height: 80px; object-fit: contain; flex-shrink: 0; }
.boss-label { font-size: 11px; color: var(--sub); letter-spacing: .5px; margin-bottom: 2px; }
.boss-name { font-size: 20px; font-weight: 800; margin-bottom: 6px; }

/* ── Counters grid ── */
.raid-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}
@media (min-width: 640px) { .raid-grid { grid-template-columns: repeat(3, 1fr); } }

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
  position: absolute; top: 8px; left: 10px;
  font-size: 11px; font-weight: 800; color: var(--sub);
}
.counter-name { font-weight: 700; font-size: 13px; text-align: center; margin-top: 2px; }

.dmg-badge { font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 10px; margin-bottom: 2px; }
.dmg-2x { background: #f0c040; color: #1a1200; }
.dmg-eff { background: #3a8f3a; color: #fff; }

.counter-move {
  display: flex; align-items: center; gap: 4px;
  font-size: 11px; color: var(--sub); width: 100%;
  justify-content: center; margin-top: 1px;
}
.move-tag { font-size: 9px; font-weight: 700; padding: 1px 4px; border-radius: 4px; flex-shrink: 0; }
.fast-tag { background: #2980ef; color: #fff; }
.charged-tag { background: #e62829; color: #fff; }

/* ── 攻略卡 ── */
.strategy-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 14px 16px;
  margin-bottom: 16px;
}
.strategy-title {
  font-size: 14px; font-weight: 800;
  margin-bottom: 12px; color: var(--text);
}
.strategy-row {
  display: flex;
  gap: 10px;
  padding: 8px 0;
  border-top: 1px solid var(--border);
  font-size: 12px;
  align-items: flex-start;
}
.strategy-label {
  flex-shrink: 0;
  width: 68px;
  color: var(--sub);
  font-weight: 600;
  padding-top: 2px;
}
.strategy-val { flex: 1; color: var(--text); line-height: 1.5; }
.strategy-row.warn .strategy-label { color: #f0c040; }
.strategy-row.warn .strategy-val { color: #f0c040; }
.strategy-row.gmax-tip .strategy-label { color: var(--accent); }
</style>
