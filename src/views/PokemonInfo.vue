<template>
  <div class="page">
    <div class="page-header">⚡ 寶可夢查詢</div>

    <div class="search-wrap" style="position:relative">
      <span class="search-icon">🔍</span>
      <input
        v-model="query"
        placeholder="輸入寶可夢名稱（中文）…"
        @input="onInput"
        @keydown.enter="search"
        @keydown.down.prevent="moveAC(1)"
        @keydown.up.prevent="moveAC(-1)"
        @blur="() => setTimeout(() => showAC = false, 150)"
        @focus="showAC = suggestions.length > 0"
      />
      <div v-if="showAC && suggestions.length" class="autocomplete">
        <div
          v-for="(s, i) in suggestions" :key="s.apiName"
          class="autocomplete-item"
          :style="i === acIndex ? 'background:var(--border)' : ''"
          @click="selectSuggestion(s)"
        >
          {{ s.zhName }}
        </div>
      </div>
    </div>

    <button class="btn" style="width:100%;margin-bottom:16px" @click="search">查詢</button>

    <div v-if="searching" class="center-msg">
      <div class="spinner"></div>
      <div>查詢中…</div>
    </div>

    <div v-else-if="error" class="center-msg" style="color:var(--accent2)">{{ error }}</div>

    <template v-else-if="result">
      <!-- Header -->
      <div class="card" style="text-align:center">
        <img
          :src="`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${result.id}.png`"
          style="width:120px;height:120px;object-fit:contain"
          @error="e => e.target.style.display='none'"
        />
        <div style="font-size:22px;font-weight:800;margin:8px 0 4px">
          {{ result.zhName }}
        </div>
        <div style="color:var(--sub);font-size:13px;margin-bottom:10px">#{{ String(result.id).padStart(4,'0') }}</div>
        <div style="display:flex;gap:8px;justify-content:center">
          <span
            v-for="t in result.types" :key="t"
            class="type-badge"
            :style="{ background: typeColors[t] }"
          >{{ typeNameZh[t] }}</span>
        </div>
      </div>

      <!-- 最佳招式 -->
      <div class="section-title">⚔️ STAB 招式（屬性一致）</div>
      <div v-if="stabMoves.length === 0" class="center-msg" style="padding:12px 0">無 STAB 招式</div>
      <div v-for="m in stabMoves.slice(0, 8)" :key="m.name" class="move-card">
        <span class="type-badge" :style="{ background: typeColors[m.type] }">{{ typeNameZh[m.type] }}</span>
        <div style="flex:1">
          <div class="move-name">{{ m.zhName }}</div>
          <div class="move-info">威力 {{ m.power ?? '—' }} ／ 命中 {{ m.accuracy ?? '—' }} ／ {{ m.dmgClass === 'physical' ? '物理' : m.dmgClass === 'special' ? '特殊' : '變化' }}</div>
        </div>
        <div style="font-size:11px;color:var(--accent);font-weight:700">STAB</div>
      </div>

      <div class="section-title">💥 高傷害招式（依威力排序）</div>
      <div v-for="m in highPowerMoves.slice(0, 8)" :key="m.name" class="move-card">
        <span class="type-badge" :style="{ background: typeColors[m.type] }">{{ typeNameZh[m.type] }}</span>
        <div style="flex:1">
          <div class="move-name">{{ m.zhName }}</div>
          <div class="move-info">威力 {{ m.power }} ／ 命中 {{ m.accuracy ?? '—' }} ／ {{ m.dmgClass === 'physical' ? '物理' : m.dmgClass === 'special' ? '特殊' : '變化' }}</div>
        </div>
        <div style="font-size:13px;font-weight:700;color:#fac000">{{ m.power }}</div>
      </div>

      <div class="section-title">🏆 對戰推薦（綜合評分）</div>
      <div v-for="m in competitiveMoves.slice(0, 8)" :key="m.name" class="move-card">
        <span class="type-badge" :style="{ background: typeColors[m.type] }">{{ typeNameZh[m.type] }}</span>
        <div style="flex:1">
          <div class="move-name">{{ m.zhName }}</div>
          <div class="move-info">威力 {{ m.power ?? '—' }} ／ 命中 {{ m.accuracy ?? '—' }} ／ {{ m.dmgClass === 'physical' ? '物理' : m.dmgClass === 'special' ? '特殊' : '變化' }}</div>
        </div>
        <div style="font-size:11px;color:#60d090;font-weight:700">{{ Math.round(m.score) }}分</div>
      </div>

      <!-- 剋制對象 -->
      <div class="section-title">✅ 適合攻擊的寶可夢（弱點對象）</div>
      <div style="margin-bottom:8px;font-size:12px;color:var(--sub)">
        {{ result.types.map(t => typeNameZh[t]).join('／') }} 招式的弱點屬性：
        <span v-for="t in weakToAttack" :key="t">
          <span class="type-badge" :style="{ background: typeColors[t], fontSize:'11px', marginLeft:'4px' }">{{ typeNameZh[t] }}</span>
        </span>
      </div>
      <div class="poke-mini-list">
        <div v-for="p in goodTargets.slice(0, 10)" :key="p.id" class="poke-mini">
          <img
            :src="`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`"
            width="32" height="32" style="image-rendering:pixelated"
          />
          <div>
            <div style="font-weight:600;font-size:13px">{{ p.zhName }}</div>
            <div style="display:flex;gap:4px;margin-top:2px">
              <span v-for="t in p.types" :key="t" class="type-badge" :style="{ background: typeColors[t], fontSize:'10px' }">{{ typeNameZh[t] }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 剋制者 -->
      <div class="section-title">⚠️ 最怕的寶可夢（剋制對象）</div>
      <div style="margin-bottom:8px;font-size:12px;color:var(--sub)">
        {{ result.types.map(t => typeNameZh[t]).join('／') }} 屬性的弱點：
        <span v-for="t in weakDefense" :key="t">
          <span class="type-badge" :style="{ background: typeColors[t], fontSize:'11px', marginLeft:'4px' }">{{ typeNameZh[t] }}</span>
        </span>
      </div>
      <div class="poke-mini-list" style="margin-bottom:16px">
        <div v-for="p in dangerTargets.slice(0, 10)" :key="p.id" class="poke-mini">
          <img
            :src="`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`"
            width="32" height="32" style="image-rendering:pixelated"
          />
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

const pokemonNameMap = inject('pokemonNameMap')
const allPokemonList = inject('allPokemonList')
const pokemonCacheReady = inject('pokemonCacheReady')

const GQL = 'https://beta.pokeapi.co/graphql/v1beta'

const suggestions = computed(() => {
  if (!query.value.trim() || !pokemonCacheReady.value) return []
  const q = query.value.trim().toLowerCase()
  return allPokemonList.value
    .filter(p => p.zhName.includes(query.value.trim()) || p.apiName.includes(q))
    .slice(0, 8)
})

function onInput() {
  showAC.value = true
  acIndex.value = -1
}

function moveAC(dir) {
  acIndex.value = Math.max(-1, Math.min(suggestions.value.length - 1, acIndex.value + dir))
}

function selectSuggestion(s) {
  query.value = s.zhName
  showAC.value = false
  search()
}

async function search() {
  showAC.value = false
  const q = query.value.trim()
  if (!q) return

  // Resolve Chinese name -> API name
  let apiName = pokemonNameMap.value[q]
  if (!apiName) {
    // Try partial match
    const match = allPokemonList.value.find(p =>
      p.zhName.includes(q) || p.apiName.toLowerCase().includes(q.toLowerCase())
    )
    if (match) apiName = match.apiName
    else { error.value = `找不到「${q}」，請確認名稱是否正確`; result.value = null; return }
  }

  searching.value = true
  error.value = ''
  result.value = null

  try {
    const res = await fetch(GQL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `query($name: String!) {
          pokemon_v2_pokemon(where: {name: {_eq: $name}}) {
            id
            pokemon_v2_pokemontypes(order_by: {slot: asc}) {
              pokemon_v2_type { name }
            }
            pokemon_v2_pokemonmoves(distinct_on: move_id) {
              pokemon_v2_move {
                name
                power
                accuracy
                pp
                pokemon_v2_type { name }
                pokemon_v2_movedamageclass { name }
                pokemon_v2_movenames(where: {pokemon_v2_language: {name: {_eq: "zh-Hant"}}}) { name }
              }
            }
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

    const moves = p.pokemon_v2_pokemonmoves
      .map(m => m.pokemon_v2_move)
      .filter(m => m.pokemon_v2_movedamageclass?.name !== 'status' && m.power)
      .map(m => ({
        name: m.name,
        zhName: m.pokemon_v2_movenames?.[0]?.name || m.name,
        power: m.power,
        accuracy: m.accuracy,
        type: m.pokemon_v2_type?.name,
        dmgClass: m.pokemon_v2_movedamageclass?.name,
        isStab: types.includes(m.pokemon_v2_type?.name),
        score: (m.power || 0) * (m.accuracy || 100) / 100 * (types.includes(m.pokemon_v2_type?.name) ? 1.5 : 1),
      }))

    result.value = { id: p.id, zhName, types, moves }
  } catch (e) {
    error.value = '查詢失敗，請稍後再試'
    console.error(e)
  } finally {
    searching.value = false
  }
}

const stabMoves = computed(() => {
  if (!result.value) return []
  return result.value.moves
    .filter(m => m.isStab)
    .sort((a, b) => b.score - a.score)
})

const highPowerMoves = computed(() => {
  if (!result.value) return []
  return [...result.value.moves].sort((a, b) => (b.power || 0) - (a.power || 0))
})

const competitiveMoves = computed(() => {
  if (!result.value) return []
  return [...result.value.moves].sort((a, b) => b.score - a.score)
})

// 攻擊面：本寶可夢屬性對哪些屬性 2x
const weakToAttack = computed(() => {
  if (!result.value) return []
  const set = new Set()
  result.value.types.forEach(t => (typeAdvantages[t] || []).forEach(w => set.add(w)))
  return [...set]
})

// 好打的寶可夢（有弱點屬性）
const goodTargets = computed(() => {
  if (!weakToAttack.value.length) return []
  return allPokemonList.value
    .filter(p => p.types.some(t => weakToAttack.value.includes(t)))
    .slice(0, 15)
})

// 防守面：本寶可夢屬性的弱點
const weakDefense = computed(() => {
  if (!result.value) return []
  const set = new Set()
  result.value.types.forEach(t => (typeWeaknesses[t] || []).forEach(w => set.add(w)))
  return [...set]
})

// 危險的寶可夢（有剋制屬性）
const dangerTargets = computed(() => {
  if (!weakDefense.value.length) return []
  return allPokemonList.value
    .filter(p => p.types.some(t => weakDefense.value.includes(t)))
    .slice(0, 15)
})
</script>
