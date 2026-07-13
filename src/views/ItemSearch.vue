<template>
  <div class="page">
    <div class="page-header">🎒 道具查詢</div>

    <div class="search-wrap">
      <span class="search-icon">🔍</span>
      <input v-model="query" placeholder="輸入道具名稱…" @input="onInput" />
    </div>

    <div v-if="loading" class="center-msg">
      <div class="spinner"></div>
      <div>載入道具資料中…</div>
    </div>

    <div v-else-if="filtered.length === 0 && query" class="center-msg">
      找不到「{{ query }}」相關道具
    </div>

    <template v-else>
      <div class="card" v-for="item in filtered.slice(0, 60)" :key="item.id">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
          <img
            :src="`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${item.apiName}.png`"
            width="32" height="32"
            style="image-rendering:pixelated"
            @error="e => e.target.style.display='none'"
          />
          <div>
            <div style="font-weight:700;font-size:16px">{{ item.zhName || item.apiName }}</div>
            <div style="font-size:12px;color:var(--sub)">{{ categoryZh[item.category] || item.category }}</div>
          </div>
        </div>
        <div v-if="item.effect" style="font-size:13px;color:#c8d0e0;line-height:1.5">
          {{ item.effect }}
        </div>
        <div v-else-if="item.flavor" style="font-size:13px;color:#c8d0e0;line-height:1.5">
          {{ item.flavor }}
        </div>
        <div v-else style="font-size:13px;color:var(--sub)">（無說明）</div>
      </div>

      <div v-if="filtered.length > 60" class="center-msg" style="font-size:13px">
        顯示前 60 筆，請輸入更精確的關鍵字
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const query = ref('')
const items = ref([])
const loading = ref(true)

const categoryZh = {
  'standard-balls': '精靈球', 'special-balls': '特殊球', 'apricorn-balls': '木果球',
  'medicines': '藥品', 'vitamins': '強化藥品', 'held-items': '攜帶道具',
  'battle-items': '戰鬥道具', 'berries': '樹果', 'tm-hm': '招式機',
  'all-mail': '信件', 'evolution': '進化道具', 'collectibles': '收藏品',
  'gameplay': '遊戲道具', 'z-crystals': 'Z水晶', 'mega-stones': '超級石',
  'plates': '石板', 'species-specific': '特殊道具', 'type-enhancement': '屬性強化',
  'bad-held-items': '不良攜帶', 'choice': '講究系列', 'mulch': '堆肥',
  'scarves': '頭巾', 'picky-healing': '精選回復', 'in-a-pinch': '緊急道具',
  'jewels': '寶石', 'training': '訓練道具', 'effort-drop': '努力值相關',
  'effort-training': '努力值訓練',
}

const GQL = 'https://beta.pokeapi.co/graphql/v1beta'

async function loadItems() {
  const CACHE_KEY = 'poke_items_v2'
  const CACHE_TTL = 86400000
  const cached = localStorage.getItem(CACHE_KEY)
  if (cached) {
    const { ts, data } = JSON.parse(cached)
    if (Date.now() - ts < CACHE_TTL) {
      items.value = data
      loading.value = false
      return
    }
  }

  try {
    const res = await fetch(GQL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `{
          pokemon_v2_item(order_by: {id: asc}) {
            id
            name
            pokemon_v2_itemnames(where: {pokemon_v2_language: {name: {_eq: "zh-Hant"}}}) { name }
            pokemon_v2_itemflavortext(
              where: {pokemon_v2_language: {name: {_eq: "zh-Hant"}}}
              order_by: {version_group_id: desc}
              limit: 1
            ) { flavor_text }
            pokemon_v2_itemeffecttexts(where: {pokemon_v2_language: {name: {_eq: "zh-Hant"}}}) { short_effect }
            pokemon_v2_itemcategory { name }
          }
        }`
      })
    })
    const json = await res.json()
    items.value = json.data.pokemon_v2_item
      .filter(i => i.pokemon_v2_itemnames.length > 0)
      .map(i => ({
        id: i.id,
        apiName: i.name,
        zhName: i.pokemon_v2_itemnames[0]?.name || i.name,
        effect: i.pokemon_v2_itemeffecttexts[0]?.short_effect || '',
        flavor: i.pokemon_v2_itemflavortext[0]?.flavor_text?.replace(/\n/g, ' ') || '',
        category: i.pokemon_v2_itemcategory?.name || '',
      }))

    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: items.value }))
  } catch (e) {
    console.error(e)
  }
  loading.value = false
}

const filtered = computed(() => {
  if (!query.value.trim()) return []
  const q = query.value.trim().toLowerCase()
  return items.value.filter(i =>
    i.zhName.toLowerCase().includes(q) ||
    i.apiName.toLowerCase().includes(q) ||
    i.effect.toLowerCase().includes(q) ||
    i.flavor.toLowerCase().includes(q)
  )
})

function onInput() {}

loadItems()
</script>
