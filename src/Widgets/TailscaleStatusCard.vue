<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Wifi, WifiOff, Shield, Lock, Globe } from 'lucide-vue-next'
import { useApiUrl } from '../composables/useApiUrl'
import { useCurrentTime } from '../composables/useCurrentTime'
import TailscaleSetupCard from './TailscaleSetupCard.vue'

const { t } = useI18n()
const { apiUrl } = useApiUrl()
const { currentTime } = useCurrentTime()

const containers = ref([])
let refreshInterval = null

async function fetchContainers() {
  try {
    const response = await fetch(`${apiUrl.value}/api/containers`)
    const data = await response.json()
    if (data.success) containers.value = data.containers
  } catch {}
}

onMounted(() => {
  fetchContainers()
  refreshInterval = setInterval(fetchContainers, 15000)
})

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval)
})

const tailscaleContainer = computed(() => {
  const list = Array.isArray(containers.value) ? containers.value : []
  const matches = list.filter((c) => {
    const name = (c?.name || '').toLowerCase()
    const names = Array.isArray(c?.Names) ? c.Names : []
    return name.includes('tailscale') || names.some((n) => (n || '').toLowerCase().includes('tailscale'))
  })
  if (!matches.length) return null
  return matches.find((c) => c?.state === 'running') || matches[0]
})

const isRunning = computed(() => tailscaleContainer.value?.state === 'running')

const uptimeMs = computed(() => {
  const c = tailscaleContainer.value
  if (!c || c.state !== 'running' || !c.created) return null
  const createdMs = Number(c.created) * 1000
  if (!Number.isFinite(createdMs)) return null
  return Math.max(0, currentTime.value - createdMs)
})

const imageVersion = computed(() => {
  const image = tailscaleContainer.value?.image || ''
  // Extract tag portion after ':'
  const tag = image.split(':')[1] || ''
  if (!tag || tag === 'latest') return 'latest'
  // Trim long sha-style tags
  return tag.length > 12 ? tag.slice(0, 12) + '…' : tag
})

const containerName = computed(() => {
  const c = tailscaleContainer.value
  if (!c) return '—'
  return c.name || '—'
})

const exposedPorts = computed(() => {
  const ports = tailscaleContainer.value?.ports
  if (!Array.isArray(ports) || !ports.length) return null
  // Collect unique public-facing ports
  const pub = [...new Set(
    ports.filter(p => p.PublicPort).map(p => p.PublicPort)
  )]
  if (!pub.length) return null
  return pub.slice(0, 3).join(', ')
})

function formatUptime(ms) {
  if (ms === null) return '—'
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ${m % 60}m`
  const d = Math.floor(h / 24)
  return `${d}d ${h % 24}h`
}
</script>

<template>
  <TailscaleSetupCard v-if="!tailscaleContainer" />
  <div v-else class="relative group h-full flex flex-col bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-black/5 dark:hover:shadow-black/40 hover:border-gray-300 dark:hover:border-zinc-600">
    <div
      class="absolute top-0 left-0 w-full h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
      :class="isRunning
        ? 'bg-linear-to-r from-transparent via-green-500 to-transparent'
        : 'bg-linear-to-r from-transparent via-red-500 to-transparent'"
    ></div>

    <div class="relative z-10 p-6 flex flex-col h-full">
      <div class="flex items-center justify-between gap-4 mb-6">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-10 h-10 rounded-lg bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-all duration-500">
            <Shield class="w-5 h-5 text-violet-500" />
          </div>
          <div class="min-w-0">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white tracking-tight truncate">Tailscale</h3>
            <div class="text-[11px] font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider mt-1">{{ t('quickMetrics.tailscaleStatusCard.meshVpn') }}</div>
          </div>
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          <div
            class="w-1.5 h-1.5 rounded-full"
            :class="isRunning ? 'bg-green-500 animate-pulse' : 'bg-red-500'"
          ></div>
          <span
            class="text-[10px] font-bold uppercase tracking-wider"
            :class="isRunning ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-400'"
          >
            {{ isRunning ? t('quickMetrics.tailscaleStatusCard.active') : t('quickMetrics.tailscaleStatusCard.down') }}
          </span>
        </div>
      </div>

      <div class="space-y-3 mt-auto">
        <div class="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-zinc-900/50 border border-gray-100 dark:border-zinc-800/50">
          <div class="flex items-center gap-2 text-gray-500 dark:text-zinc-400">
            <Wifi v-if="isRunning" class="w-3.5 h-3.5 text-green-500 shrink-0" />
            <WifiOff v-else class="w-3.5 h-3.5 text-red-400 shrink-0" />
            <span class="text-[10px] font-bold uppercase tracking-wider">{{ isRunning ? t('quickMetrics.tailscaleStatusCard.uptime') : t('quickMetrics.tailscaleStatusCard.status') }}</span>
          </div>
          <span class="text-sm font-semibold text-gray-900 dark:text-white tabular-nums">
            {{ isRunning ? formatUptime(uptimeMs) : t('quickMetrics.tailscaleStatusCard.offline') }}
          </span>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div class="p-3 rounded-lg bg-gray-50 dark:bg-zinc-900/50 border border-gray-100 dark:border-zinc-800/50">
            <div class="flex items-center gap-1.5 mb-2 text-gray-500 dark:text-zinc-400">
              <Lock class="w-3 h-3" />
              <span class="text-[9px] font-bold uppercase tracking-widest">{{ t('quickMetrics.tailscaleStatusCard.encryption') }}</span>
            </div>
            <div class="text-sm font-semibold text-gray-800 dark:text-zinc-200 tracking-tight">{{ t('quickMetrics.tailscaleStatusCard.wireGuard') }}</div>
          </div>

          <div class="p-3 rounded-lg bg-gray-50 dark:bg-zinc-900/50 border border-gray-100 dark:border-zinc-800/50">
            <div class="flex items-center gap-1.5 mb-2 text-gray-500 dark:text-zinc-400">
              <Globe class="w-3 h-3" />
              <span class="text-[9px] font-bold uppercase tracking-widest">{{ exposedPorts ? t('quickMetrics.tailscaleStatusCard.ports') : t('quickMetrics.tailscaleStatusCard.version') }}</span>
            </div>
            <div class="text-sm font-semibold text-gray-800 dark:text-zinc-200 tracking-tight font-mono truncate">{{ exposedPorts ? exposedPorts : imageVersion }}</div>
          </div>
      </div>

        <div class="pt-3 border-t border-gray-100 dark:border-zinc-800/50 flex items-center justify-between gap-3">
          <span class="text-[11px] text-gray-400 dark:text-zinc-500 font-mono truncate">{{ containerName }}</span>
          <span class="text-[11px] font-medium text-gray-500 dark:text-zinc-400 truncate text-right">
            {{ isRunning ? t('quickMetrics.tailscaleStatusCard.wireGuardMeshActive') : t('quickMetrics.tailscaleStatusCard.remoteAccessUnavailable') }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
