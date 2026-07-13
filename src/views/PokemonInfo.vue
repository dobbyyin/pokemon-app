<template>
  <div class="page">
    <!-- ─── 比較模式（滿版橫向捲動三欄） ─── -->
    <template v-if="compareMode">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
        <button class="btn btn-sm" style="background:var(--card);color:var(--text);border:1px solid var(--border)" @click="compareMode = false">← 返回</button>
        <span style="font-size:16px;font-weight:700">比較</span>
      </div>

      <!-- 三欄橫向捲動，每欄滿版內容 -->
      <div class="cmp-scroll">
        <div v-for="(p, ci) in paddedCompare" :key="ci" class="cmp-col">
          <template v-if="p">
            <!-- Header -->
            <div class="card" style="text-align:center;margin-bottom:10px">
              <img :src="`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${p.id}.png`"
                style="width:90px;height:90px;object-fit:contain"
                @error="e => e.target.style.display='none'" />
              <div style="font-size:18px;font-weight:800;margin:6px 0 2px">{{ p.zhName }}</div>
              <div style="color:var(--sub);font-size:12px;margin-bottom:8px">#{{ String(p.id).padStart(4,'0') }}</div>
              <div style="display:flex;gap:6px;justify-content:center;margin-bottom:10px">
                <span v-for="t in p.types" :key="t" class="type-badge" :style="{ background: typeColors[t] }">{{ typeNameZh[t] }}</span>
              </div>
              <div style="display:inline-flex;align-items:center;gap:8px;background:var(--surface);border-radius:10px;padding:7px 14px">
                <span style="font-size:11px;color:var(--sub)">紅三星 CP</span>
                <span style="font-size:20px;font-weight:800;color:var(--accent)">{{ p.cp ?? '—' }}</span>
              </div>
            </div>

            <!-- PVP -->
            <div class="section-title">🏆 PVP 推薦招式</div>
            <div v-if="p.pvpFast" class="move-card">
              <span class="move-tag fast-tag" style="font-size:11px;padding:3px 8px">快速技</span>
              <span class="type-badge" :style="{background: typeColors[p.pvpFast.type?.toLowerCase()]}">{{ typeNameZh[p.pvpFast.type?.toLowerCase()] }}</span>
              <div style="flex:1"><div class="move-name">{{ zhMove(p.pvpFast.name) }}</div><div class="move-info">威力 {{ p.pvpFast.power }} ／ 能量 +{{ p.pvpFast.energy_delta }}</div></div>
            </div>
            <div v-if="p.pvpCharged" class="move-card">
              <span class="move-tag charged-tag" style="font-size:11px;padding:3px 8px">技能技</span>
              <span class="type-badge" :style="{background: typeColors[p.pvpCharged.type?.toLowerCase()]}">{{ typeNameZh[p.pvpCharged.type?.toLowerCase()] }}</span>
              <div style="flex:1"><div class="move-name">{{ zhMove(p.pvpCharged.name) }}</div><div class="move-info">威力 {{ p.pvpCharged.power }} ／ 消耗 {{ Math.abs(p.pvpCharged.energy_delta) }} 能量</div></div>
            </div>

            <!-- PVE -->
            <div class="section-title">⚔️ PVE 推薦招式</div>
            <div v-if="p.pveFast" class="move-card">
              <span class="move-tag fast-tag" style="font-size:11px;padding:3px 8px">快速技</span>
              <span class="type-badge" :style="{background: typeColors[p.pveFast.type?.toLowerCase()]}">{{ typeNameZh[p.pveFast.type?.toLowerCase()] }}</span>
              <div style="flex:1"><div class="move-name">{{ zhMove(p.pveFast.name) }}</div><div class="move-info">威力 {{ p.pveFast.power }}</div></div>
            </div>
            <div v-if="p.pveCharged" class="move-card">
              <span class="move-tag charged-tag" style="font-size:11px;padding:3px 8px">技能技</span>
              <span class="type-badge" :style="{background: typeColors[p.pveCharged.type?.toLowerCase()]}">{{ typeNameZh[p.pveCharged.type?.toLowerCase()] }}</span>
              <div style="flex:1"><div class="move-name">{{ zhMove(p.pveCharged.name) }}</div><div class="move-info">威力 {{ p.pveCharged.power }} ／ 消耗 {{ Math.abs(p.pveCharged.energy_delta) }} 能量</div></div>
            </div>

            <!-- 特招 -->
            <template v-if="p.eliteFast?.length || p.eliteCharged?.length">
              <div class="section-title">⭐ 特招（Elite TM）</div>
              <div v-for="m in p.eliteFast" :key="m.name" class="move-card elite-card">
                <span class="move-tag fast-tag" style="font-size:11px;padding:3px 8px;background:#b07a20">快速技</span>
                <span class="type-badge" :style="{background: typeColors[m.type?.toLowerCase()]}">{{ typeNameZh[m.type?.toLowerCase()] }}</span>
                <div style="flex:1"><div class="move-name">{{ zhMove(m.name) }}</div></div>
                <span class="elite-badge">限定</span>
              </div>
              <div v-for="m in p.eliteCharged" :key="m.name" class="move-card elite-card">
                <span class="move-tag charged-tag" style="font-size:11px;padding:3px 8px;background:#b07a20">技能技</span>
                <span class="type-badge" :style="{background: typeColors[m.type?.toLowerCase()]}">{{ typeNameZh[m.type?.toLowerCase()] }}</span>
                <div style="flex:1"><div class="move-name">{{ zhMove(m.name) }}</div></div>
                <span class="elite-badge">限定</span>
              </div>
            </template>

            <!-- 剋制 -->
            <div class="section-title">✅ 剋制屬性</div>
            <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:12px">
              <span v-for="t in getWeakToAttack(p.types)" :key="t" class="type-badge" :style="{ background: typeColors[t] }">{{ typeNameZh[t] }}</span>
              <span v-if="!getWeakToAttack(p.types).length" style="font-size:12px;color:var(--sub)">無</span>
            </div>

            <!-- 弱點 -->
            <div class="section-title">⚠️ 弱點屬性</div>
            <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:12px">
              <span v-for="t in getWeakDefense(p.types)" :key="t" class="type-badge" :style="{ background: typeColors[t] }">{{ typeNameZh[t] }}</span>
            </div>

            <!-- 適合攻擊 -->
            <div class="section-title">✅ 適合攻擊</div>
            <div class="poke-mini-list" style="margin-bottom:12px">
              <div v-for="pk in allPokemonList.filter(pk => pk.types.some(t => getWeakToAttack(p.types).includes(t))).slice(0,8)" :key="pk.id" class="poke-mini">
                <img :src="`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pk.id}.png`" width="28" height="28" style="image-rendering:pixelated" />
                <div>
                  <div style="font-weight:600;font-size:12px">{{ pk.zhName }}</div>
                  <div style="display:flex;gap:3px;margin-top:1px">
                    <span v-for="t in pk.types" :key="t" class="type-badge" :style="{ background: typeColors[t], fontSize:'9px' }">{{ typeNameZh[t] }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 最怕 -->
            <div class="section-title">⚠️ 最怕</div>
            <div class="poke-mini-list" style="margin-bottom:16px">
              <div v-for="pk in allPokemonList.filter(pk => pk.types.some(t => getWeakDefense(p.types).includes(t))).slice(0,8)" :key="pk.id" class="poke-mini">
                <img :src="`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pk.id}.png`" width="28" height="28" style="image-rendering:pixelated" />
                <div>
                  <div style="font-weight:600;font-size:12px">{{ pk.zhName }}</div>
                  <div style="display:flex;gap:3px;margin-top:1px">
                    <span v-for="t in pk.types" :key="t" class="type-badge" :style="{ background: typeColors[t], fontSize:'9px' }">{{ typeNameZh[t] }}</span>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <div v-else class="cmp-empty">—</div>
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

      <!-- Filter chips -->
      <div class="poke-filters">
        <button :class="['poke-filter-chip', filterMode==='' && 'active']" @click="filterMode=''">全部</button>
        <button :class="['poke-filter-chip', filterMode==='elite' && 'active']" @click="filterMode = filterMode==='elite' ? '' : 'elite'">
          ⭐ 有特招<template v-if="goDataReady"> ({{ eliteList.length }})</template>
        </button>
      </div>

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

      <!-- ⭐ 特招篩選列表 -->
      <template v-if="filterMode === 'elite'">
        <div v-if="!goDataReady" class="center-msg">
          <div class="spinner"></div><div>GO 資料載入中…</div>
        </div>
        <template v-else>
          <div style="font-size:12px;color:var(--sub);margin-bottom:10px">
            共 {{ eliteList.length }} 隻・點擊查看詳情，勾選加入比較（最多 3 隻）
          </div>
          <div v-for="p in eliteList" :key="p.id" class="flist-item">
            <button
              class="flist-check" :class="{ selected: isInCompare(p.id) }"
              :disabled="!isInCompare(p.id) && compareList.length >= 3"
              @click.stop="toggleCompareFromList(p)">
              {{ isInCompare(p.id) ? '☑' : '☐' }}
            </button>
            <img
              :src="`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`"
              width="40" height="40" style="image-rendering:pixelated;cursor:pointer;flex-shrink:0"
              @click="searchFromList(p)"
              @error="e => e.target.style.display='none'" />
            <div style="flex:1;cursor:pointer;min-width:0" @click="searchFromList(p)">
              <div style="font-weight:700;font-size:14px">{{ p.zhName }}</div>
              <div style="display:flex;gap:3px;margin:2px 0;flex-wrap:wrap">
                <span v-for="t in p.types" :key="t" class="type-badge"
                  :style="{ background: typeColors[t], fontSize:'10px', padding:'1px 5px' }">{{ typeNameZh[t] }}</span>
              </div>
              <div style="font-size:11px;color:#f0c040">⭐ {{ eliteMoveNamesForPoke(p.id) }}</div>
            </div>
            <div style="font-size:14px;font-weight:800;color:var(--accent);white-space:nowrap;flex-shrink:0">
              {{ calcCP(p.id) ?? '—' }}
            </div>
          </div>
        </template>
      </template>

      <!-- 一般搜尋結果 -->
      <template v-else>

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
                <div class="move-name">{{ zhMove(result.pvpFast.name) }}</div>
                <div class="move-info">威力 {{ result.pvpFast.power }} ／ 能量 +{{ result.pvpFast.energy_delta }} ／ {{ result.pvpFast.duration }}ms</div>
              </div>
            </div>
            <div v-if="result.pvpCharged" class="move-card">
              <span class="move-tag charged-tag" style="font-size:11px;padding:3px 8px">技能技</span>
              <span class="type-badge" :style="{background: typeColors[result.pvpCharged.type?.toLowerCase()]}">{{ typeNameZh[result.pvpCharged.type?.toLowerCase()] }}</span>
              <div style="flex:1">
                <div class="move-name">{{ zhMove(result.pvpCharged.name) }}</div>
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
                <div class="move-name">{{ zhMove(result.pveFast.name) }}</div>
                <div class="move-info">威力 {{ result.pveFast.power }} ／ {{ result.pveFast.duration }}ms</div>
              </div>
            </div>
            <div v-if="result.pveCharged" class="move-card">
              <span class="move-tag charged-tag" style="font-size:11px;padding:3px 8px">技能技</span>
              <span class="type-badge" :style="{background: typeColors[result.pveCharged.type?.toLowerCase()]}">{{ typeNameZh[result.pveCharged.type?.toLowerCase()] }}</span>
              <div style="flex:1">
                <div class="move-name">{{ zhMove(result.pveCharged.name) }}</div>
                <div class="move-info">威力 {{ result.pveCharged.power }} ／ 消耗 {{ Math.abs(result.pveCharged.energy_delta) }} 能量</div>
              </div>
            </div>
          </div>
        </template>

        <!-- 特招 -->
        <template v-if="goDataReady && (result.eliteFast?.length || result.eliteCharged?.length)">
          <div class="section-title">⭐ 特招（Elite TM）</div>
          <div v-for="m in result.eliteFast" :key="m.name" class="move-card elite-card">
            <span class="move-tag fast-tag" style="font-size:11px;padding:3px 8px;background:#b07a20">快速技</span>
            <span class="type-badge" :style="{background: typeColors[m.type?.toLowerCase()]}">{{ typeNameZh[m.type?.toLowerCase()] }}</span>
            <div style="flex:1">
              <div class="move-name">{{ zhMove(m.name) }}</div>
              <div class="move-info">威力 {{ m.power }} ／ 能量 +{{ m.energy_delta }}</div>
            </div>
            <span class="elite-badge">限定</span>
          </div>
          <div v-for="m in result.eliteCharged" :key="m.name" class="move-card elite-card">
            <span class="move-tag charged-tag" style="font-size:11px;padding:3px 8px;background:#b07a20">技能技</span>
            <span class="type-badge" :style="{background: typeColors[m.type?.toLowerCase()]}">{{ typeNameZh[m.type?.toLowerCase()] }}</span>
            <div style="flex:1">
              <div class="move-name">{{ zhMove(m.name) }}</div>
              <div class="move-info">威力 {{ m.power }} ／ 消耗 {{ Math.abs(m.energy_delta) }} 能量</div>
            </div>
            <span class="elite-badge">限定</span>
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

      </template><!-- /一般搜尋結果 -->
    </template>
  </div>
</template>

<script setup>
import { ref, computed, inject, watch, onUnmounted } from 'vue'
import { typeNameZh, typeColors, typeAdvantages, typeWeaknesses } from '../utils/typeData.js'

const query = ref('')
const searching = ref(false)
const error = ref('')
const result = ref(null)
const showAC = ref(false)
const acIndex = ref(-1)
const compareList = ref([])
const compareMode = ref(false)
const filterMode = ref('')  // '' | 'elite'

const pokemonNameMap = inject('pokemonNameMap')
const allPokemonList = inject('allPokemonList')
const pokemonCacheReady = inject('pokemonCacheReady')
const goStats = inject('goStats')
const goFastMoves = inject('goFastMoves')
const goChargedMoves = inject('goChargedMoves')
const goPokemonMoves = inject('goPokemonMoves')
const goDataReady = inject('goDataReady')
const moveNameZh = inject('moveNameZh')
const setAppWide = inject('setAppWide')
watch(compareMode, v => setAppWide(v))
onUnmounted(() => setAppWide(false))

function zhMove(goName) {
  if (!goName) return ''
  // "Psycho Cut" → "psycho-cut" → lookup；再試 "psychocut"
  const key1 = goName.toLowerCase().replace(/ /g, '-')
  const key2 = goName.toLowerCase().replace(/[\s-]/g, '')
  return moveNameZh.value[key1] || moveNameZh.value[key2] || goName
}

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

  const eliteFastObjs = moveEntry.eliteFast.map(n => goFastMoves.value[n]).filter(Boolean)
  const eliteChargedObjs = moveEntry.eliteCharged.map(n => goChargedMoves.value[n]).filter(Boolean)

  return {
    pvpFast: [...allFast].sort((a, b) => pvpFastScore(b) - pvpFastScore(a))[0] || null,
    pvpCharged: [...allCharged].sort((a, b) => pvpChargedScore(b) - pvpChargedScore(a))[0] || null,
    pveFast: [...allFast].sort((a, b) => pveFastScore(b) - pveFastScore(a))[0] || null,
    pveCharged: [...allCharged].sort((a, b) => pveChargedScore(b) - pveChargedScore(a))[0] || null,
    eliteFast: eliteFastObjs,
    eliteCharged: eliteChargedObjs,
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

// ── Filter: 有特招 ──
const eliteList = computed(() => {
  if (!goDataReady.value || !allPokemonList.value.length) return []
  return allPokemonList.value.filter(p => {
    const m = goPokemonMoves.value[p.id]
    return m && (m.eliteFast.length > 0 || m.eliteCharged.length > 0)
  }).sort((a, b) => a.id - b.id)
})

function buildPokemonData(p) {
  const cp = calcCP(p.id)
  const moves = goDataReady.value ? getBestMoves(p.id, p.types) : {}
  return { id: p.id, zhName: p.zhName, types: p.types, cp, ...moves }
}

function searchFromList(p) {
  result.value = buildPokemonData(p)
  error.value = ''
  searching.value = false
  filterMode.value = ''
}

function toggleCompareFromList(p) {
  if (isInCompare(p.id)) { removeFromCompare(p.id); return }
  if (compareList.value.length >= 3) return
  compareList.value.push(buildPokemonData(p))
}

function eliteMoveNamesForPoke(id) {
  const m = goPokemonMoves.value[id]
  if (!m) return ''
  return [...m.eliteFast, ...m.eliteCharged].map(n => zhMove(n)).filter(Boolean).join('、')
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

/* ─── Compare scroll ─── */
.cmp-scroll {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 8px;
  scroll-snap-type: x mandatory;
}
.cmp-scroll::-webkit-scrollbar { height: 4px; }
.cmp-scroll::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

.cmp-col {
  flex: 0 0 calc(100% - 32px); /* 每欄接近全寬 */
  scroll-snap-align: start;
  min-width: 280px;
}
.cmp-empty {
  flex: 0 0 calc(100% - 32px);
  min-width: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--card);
  border: 1px dashed var(--border);
  border-radius: 14px;
  color: var(--border);
  font-size: 32px;
  min-height: 200px;
}

/* ─── 舊 col-* 保留給 compare-bar 內小圖用 ─── */
.move-tag { font-size: 9px; font-weight: 700; padding: 2px 4px; border-radius: 4px; flex-shrink: 0; }
.fast-tag { background: #2980ef; color: #fff; }
.charged-tag { background: #e62829; color: #fff; }
.move-row-name { font-size: 10px; color: var(--text); flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* ─── Filter chips (寶可夢頁) ─── */
.poke-filters {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.poke-filter-chip {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid var(--border);
  background: var(--card);
  color: var(--sub);
  cursor: pointer;
  transition: all .15s;
}
.poke-filter-chip.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

/* ─── Filter list items ─── */
.flist-item {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 10px 12px;
  margin-bottom: 8px;
}
.flist-check {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--sub);
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  transition: all .15s;
}
.flist-check.selected {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}
.flist-check:disabled { opacity: .4; cursor: not-allowed; }

/* ─── Move cards (search mode) ─── */
.move-card { background: var(--card2, #1e1e38); border: 1px solid var(--border); border-radius: 10px; padding: 10px 12px; margin-bottom: 8px; display: flex; align-items: center; gap: 10px; }
.move-name { font-weight: 600; font-size: 14px; }
.move-info { font-size: 12px; color: var(--sub); }
.elite-card { border-color: #c0902a; background: #1e1a0e; }
.elite-badge { font-size: 11px; color: #f0c040; font-weight: 700; flex-shrink: 0; }
</style>
