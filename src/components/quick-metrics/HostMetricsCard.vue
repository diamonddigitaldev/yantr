<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Cpu, MemoryStick, Server, ShieldCheck } from 'lucide-vue-next'
import { formatBytes } from '../../utils/metrics'

const { t } = useI18n()
const props = defineProps({
  apiUrl: { type: String, required: true }
})

const systemInfo = ref(null)
const loading = ref(true)
const error = ref(null)
let refreshInterval = null

// Animated display values
const displayCores = ref(0)
const displayMemBytes = ref(0)
const displayStoragePercent = ref(0)

function countUpTo(targetRef, targetVal, duration = 900) {
  const startVal = targetRef.value
  const startTime = Date.now()
  const tick = () => {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3)
    targetRef.value = Math.round(startVal + eased * (targetVal - startVal))
    if (progress < 1) requestAnimationFrame(tick)
    else targetRef.value = targetVal
  }
  requestAnimationFrame(tick)
}

const cpuInfo = computed(() => ({ cores: systemInfo.value?.cpu?.cores ?? 0 }))

const memoryInfo = computed(() => {
  if (!systemInfo.value) return { total: 0, totalFormatted: '0 B' }
  const total = systemInfo.value.memory.total
  return { total, totalFormatted: formatBytes(total) }
})

const displayMemFormatted = computed(() => formatBytes(displayMemBytes.value))

const storageInfo = computed(() => {
  if (!systemInfo.value?.storage) return { used: 0, total: 0, percent: 0, usedFormatted: '0 B', totalFormatted: '0 B', hasData: false }
  const { used, total } = systemInfo.value.storage
  if (used && used > 0) {
    if (total && total > 0) {
      const percent = Math.round((used / total) * 100)
      return { used, total, percent, usedFormatted: formatBytes(used), totalFormatted: formatBytes(total), hasData: true }
    }
    return { used, total: 0, percent: 0, usedFormatted: formatBytes(used), totalFormatted: null, hasData: true }
  }
  return { used: 0, total: 0, percent: 0, usedFormatted: '0 B', totalFormatted: '0 B', hasData: false }
})

const osInfo = computed(() => {
  if (!systemInfo.value?.os) return null
  return {
    name: systemInfo.value.os.name.replace('Debian GNU/Linux', 'Debian').replace('Ubuntu', 'Ubuntu'),
    type: systemInfo.value.os.type,
    arch: systemInfo.value.os.arch || systemInfo.value.os.architecture,
    kernel: systemInfo.value.os.kernel
  }
})

watch(systemInfo, (info) => {
  if (!info) return
  countUpTo(displayCores, info.cpu?.cores ?? 0)
  countUpTo(displayMemBytes, info.memory?.total ?? 0, 1000)
  if (info.storage?.used > 0 && info.storage?.total > 0) {
    countUpTo(displayStoragePercent, Math.round((info.storage.used / info.storage.total) * 100))
  }
})

async function fetchSystemInfo() {
  try {
    const response = await fetch(`${props.apiUrl}/api/system/info`)
    const data = await response.json()
    if (data.success) {
      systemInfo.value = data.info
      error.value = null
    } else {
      error.value = data.error || 'Failed to fetch system info'
    }
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchSystemInfo()
  refreshInterval = setInterval(fetchSystemInfo, 30000)
})

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval)
})
</script>

<template>
  <div class="relative group h-full flex flex-col bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden transition-all duration-400 hover:shadow-2xl hover:shadow-black/5 dark:hover:shadow-black/40 hover:border-gray-300 dark:hover:border-zinc-600">

    <!-- Top accent line -->
    <div class="absolute top-0 left-0 w-full h-0.5 bg-linear-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

    <!-- Dot-grid texture -->
    <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMTUwLCAxNTAsIDE1MCwgMC4xKSIvPjwvc3ZnPg==')] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none mask-[linear-gradient(to_bottom,white,transparent)]"></div>

    <!-- Scan line (always present, sweeps top→bottom every 5s) -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none rounded-xl z-10">
      <div class="scan-line absolute left-0 w-full h-px bg-linear-to-r from-transparent via-blue-400/50 to-transparent"></div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="relative z-20 p-6 flex-1 flex flex-col items-center justify-center">
      <div class="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping mb-3"></div>
      <span class="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{{ t('quickMetrics.hostMetrics.scanningHost') }}</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="relative z-20 p-6 flex flex-col items-center justify-center h-full text-center">
      <div class="border border-red-200 dark:border-red-900/50 p-4 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 w-full">
        <span class="block text-[10px] font-bold mb-1 uppercase tracking-widest">{{ t('quickMetrics.hostMetrics.connectionFailed') }}</span>
        <span class="text-xs opacity-80 wrap-break-word line-clamp-2">{{ error }}</span>
      </div>
    </div>

    <!-- Content -->
    <div v-else class="relative z-20 p-6 flex flex-col h-full gap-5">

      <!-- Header -->
      <div class="flex items-start justify-between">
        <div class="min-w-0 pr-2">
          <div class="flex items-center gap-2 mb-1">
            <Server class="w-3.5 h-3.5 text-blue-500" />
            <span class="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-zinc-500">{{ t('quickMetrics.hostMetrics.hostSystem') }}</span>
          </div>
          <div class="text-base font-semibold text-gray-900 dark:text-white truncate tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" :title="osInfo.name">
            {{ osInfo.name }}
          </div>
        </div>
        <div class="text-right shrink-0">
          <div class="flex items-center justify-end gap-1.5 mb-1.5">
            <!-- triple-ring pulse -->
            <span class="relative flex h-2.5 w-2.5">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60"></span>
              <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            <span class="text-[10px] text-green-600 dark:text-green-500 font-bold uppercase tracking-wider">{{ t('quickMetrics.hostMetrics.online') }}</span>
          </div>
          <div class="text-[10px] text-gray-400 dark:text-zinc-500 font-mono">{{ osInfo.arch }}</div>
        </div>
      </div>

      <!-- Specs Grid -->
      <div class="grid grid-cols-2 gap-3 flex-1">

        <!-- CPU -->
        <div class="stat-box flex flex-col p-3 rounded-lg bg-gray-50 dark:bg-zinc-900/50 border border-gray-100 dark:border-zinc-800/50 group-hover:border-blue-200/60 dark:group-hover:border-blue-500/20 transition-colors overflow-hidden relative">
          <div class="absolute inset-0 bg-linear-to-br from-blue-500/0 to-blue-500/0 group-hover:from-blue-500/5 group-hover:to-transparent transition-all duration-500 pointer-events-none rounded-lg"></div>
          <div class="flex items-center gap-1.5 mb-2 text-gray-500 dark:text-zinc-400">
            <Cpu class="w-3 h-3" />
            <span class="text-[9px] font-bold uppercase tracking-widest">{{ t('quickMetrics.hostMetrics.processors') }}</span>
          </div>
          <div class="flex items-baseline gap-1 mt-auto">
            <span class="text-2xl font-bold text-gray-900 dark:text-white tabular-nums tracking-tighter transition-all duration-300">{{ displayCores }}</span>
            <span class="text-[10px] text-gray-400 dark:text-zinc-500 font-medium">{{ t('quickMetrics.hostMetrics.cores') }}</span>
          </div>
          <!-- thin bottom bar decoration -->
          <div class="absolute bottom-0 left-0 h-0.5 bg-linear-to-r from-blue-500/60 to-transparent bar-fill-anim"></div>
        </div>

        <!-- RAM -->
        <div class="stat-box flex flex-col p-3 rounded-lg bg-gray-50 dark:bg-zinc-900/50 border border-gray-100 dark:border-zinc-800/50 group-hover:border-violet-200/60 dark:group-hover:border-violet-500/20 transition-colors overflow-hidden relative">
          <div class="absolute inset-0 bg-linear-to-br from-violet-500/0 to-violet-500/0 group-hover:from-violet-500/5 group-hover:to-transparent transition-all duration-500 pointer-events-none rounded-lg"></div>
          <div class="flex items-center gap-1.5 mb-2 text-gray-500 dark:text-zinc-400">
            <MemoryStick class="w-3 h-3" />
            <span class="text-[9px] font-bold uppercase tracking-widest">{{ t('quickMetrics.hostMetrics.memory') }}</span>
          </div>
          <div class="flex items-baseline gap-1 mt-auto">
            <span class="text-xl font-bold text-gray-900 dark:text-white tabular-nums tracking-tighter transition-all duration-300">{{ displayMemFormatted.split(' ')[0] }}</span>
            <span class="text-[10px] text-gray-400 dark:text-zinc-500 font-medium">{{ displayMemFormatted.split(' ')[1] }}</span>
          </div>
          <div class="absolute bottom-0 left-0 h-0.5 bg-linear-to-r from-violet-500/60 to-transparent bar-fill-anim" style="animation-delay: 0.15s"></div>
        </div>
      </div>

      <!-- Storage bar (if available) -->
      <div v-if="storageInfo.hasData && storageInfo.total > 0" class="space-y-1.5">
        <div class="flex items-center justify-between">
          <span class="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500">{{ t('quickMetrics.hostMetrics.dockerVol') }}</span>
          <span class="text-[10px] font-bold text-gray-700 dark:text-gray-300 tabular-nums">{{ storageInfo.usedFormatted }} / {{ storageInfo.totalFormatted }}</span>
        </div>
        <div class="h-1 w-full rounded-full bg-gray-100 dark:bg-zinc-800 overflow-hidden">
          <div
            class="h-full rounded-full bg-linear-to-r from-blue-500 to-violet-500 transition-all duration-1000 ease-out"
            :style="{ width: displayStoragePercent + '%' }"
          ></div>
        </div>
      </div>

      <!-- Footer / Kernel -->
      <div class="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-zinc-800/80">
        <div class="flex items-center gap-1.5 text-gray-500 dark:text-zinc-500">
          <ShieldCheck class="w-3.5 h-3.5" />
          <span class="text-[10px] font-bold uppercase tracking-widest">{{ t('quickMetrics.hostMetrics.kernel', { kernel: osInfo.kernel }) }}</span>
        </div>
        <div v-if="storageInfo.hasData && !storageInfo.total" class="flex items-center gap-2">
          <span class="text-[10px] font-medium text-gray-400 dark:text-zinc-500">{{ t('quickMetrics.hostMetrics.dockerVol') }}</span>
          <span class="text-xs font-bold text-gray-700 dark:text-gray-300 tabular-nums">{{ storageInfo.usedFormatted }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes scan {
  0%   { top: -2px; opacity: 0; }
  5%   { opacity: 1; }
  92%  { opacity: 0.8; }
  100% { top: 100%; opacity: 0; }
}
.scan-line {
  animation: scan 5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes barFill {
  0%   { width: 0%; opacity: 0; }
  30%  { opacity: 1; }
  100% { width: 100%; opacity: 1; }
}
.bar-fill-anim {
  animation: barFill 1.2s ease-out forwards;
}
</style>
