<script setup>
import { ref, computed, onMounted, onUnmounted, watch} from "vue";
import { useI18n } from "vue-i18n";
({ colSpan: 1 });
import { Layers, Database, Box, HardDrive, Cpu, MemoryStick, Server } from "lucide-vue-next";
import { formatBytes } from "../utils/metrics";
import { useApiUrl } from "../composables/useApiUrl";

const { t } = useI18n();
const { apiUrl } = useApiUrl();

const systemInfo = ref(null);
const containers = ref([]);
const volumes = ref([]);
const images = ref([]);
const loading = ref(true);
const error = ref(null);
let refreshInterval = null;

const displayCores = ref(0);
const displayMemBytes = ref(0);
const displayStoragePercent = ref(0);

function countUpTo(targetRef, targetVal, duration = 900) {
  const startVal = targetRef.value;
  const startTime = Date.now();

  const tick = () => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    targetRef.value = Math.round(startVal + eased * (targetVal - startVal));
    if (progress < 1) requestAnimationFrame(tick);
    else targetRef.value = targetVal;
  };

  requestAnimationFrame(tick);
}

const runningApps = computed(() => containers.value.filter((container) => container.state === "running").length);
const totalVolumes = computed(() => volumes.value.length);
const imagesCount = computed(() => images.value.length);
const temporaryCount = computed(() => containers.value.filter((container) => container?.labels?.["yantr.expireAt"]).length);

const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 5) return t("home.overviewPulseCard.lateNightCoding");
  if (hour < 12) return t("home.overviewPulseCard.goodMorning");
  if (hour < 18) return t("home.overviewPulseCard.goodAfternoon");
  return t("home.overviewPulseCard.goodEvening");
});

const osInfo = computed(() => {
  if (!systemInfo.value?.os) {
    return {
      name: "Unknown Host",
      type: "--",
      arch: "--",
      kernel: "--",
    };
  }

  return {
    name: systemInfo.value.os.name.replace("Debian GNU/Linux", "Debian").replace("Ubuntu", "Ubuntu"),
    type: systemInfo.value.os.type,
    arch: systemInfo.value.os.arch || systemInfo.value.os.architecture,
    kernel: systemInfo.value.os.kernel,
  };
});

const storageInfo = computed(() => {
  if (!systemInfo.value?.storage) {
    return { used: 0, total: 0, percent: 0, usedFormatted: "0 B", totalFormatted: "0 B", hasData: false };
  }

  const { used, total } = systemInfo.value.storage;
  if (used && used > 0) {
    if (total && total > 0) {
      const percent = Math.round((used / total) * 100);
      return { used, total, percent, usedFormatted: formatBytes(used), totalFormatted: formatBytes(total), hasData: true };
    }
    return { used, total: 0, percent: 0, usedFormatted: formatBytes(used), totalFormatted: null, hasData: true };
  }

  return { used: 0, total: 0, percent: 0, usedFormatted: "0 B", totalFormatted: "0 B", hasData: false };
});

const displayMemFormatted = computed(() => formatBytes(displayMemBytes.value));

const displayMemParts = computed(() => {
  const [value = "0", unit = "B"] = displayMemFormatted.value.split(" ");
  return { value, unit };
});

const overviewStats = computed(() => [
  {
    key: "apps",
    label: t("home.overviewPulseCard.apps"),
    value: runningApps.value,
    icon: Layers,
    tone: "text-blue-500",
  },
  {
    key: "volumes",
    label: t("home.overviewPulseCard.volumes"),
    value: totalVolumes.value,
    icon: HardDrive,
    tone: "text-violet-500",
  },
  {
    key: "images",
    label: t("home.overviewPulseCard.images"),
    value: imagesCount.value,
    icon: Database,
    tone: "text-green-500",
  },
  {
    key: "temp",
    label: t("home.overviewPulseCard.temp"),
    value: temporaryCount.value,
    icon: Box,
    tone: "text-amber-500",
  },
]);

const hostStats = computed(() => [
  {
    key: "cpu",
    label: t("quickMetrics.hostMetrics.processors"),
    value: String(displayCores.value),
    suffix: t("quickMetrics.hostMetrics.cores"),
    icon: Cpu,
    tone: "text-blue-500",
  },
  {
    key: "memory",
    label: t("quickMetrics.hostMetrics.memory"),
    value: displayMemParts.value.value,
    suffix: displayMemParts.value.unit,
    icon: MemoryStick,
    tone: "text-violet-500",
  },
  {
    key: "storage",
    label: t("quickMetrics.hostMetrics.dockerVol"),
    value: storageInfo.value.total > 0
      ? `${storageInfo.value.usedFormatted} / ${storageInfo.value.totalFormatted}`
      : storageInfo.value.hasData
        ? storageInfo.value.usedFormatted
        : "0 B",
    suffix: storageInfo.value.total > 0 ? `${displayStoragePercent.value}%` : "",
    icon: HardDrive,
    tone: "text-emerald-500",
  },
]);

watch(systemInfo, (info) => {
  if (!info) return;
  countUpTo(displayCores, info.cpu?.cores ?? 0);
  countUpTo(displayMemBytes, info.memory?.total ?? 0, 1000);

  if (info.storage?.used > 0 && info.storage?.total > 0) {
    countUpTo(displayStoragePercent, Math.round((info.storage.used / info.storage.total) * 100));
  } else {
    displayStoragePercent.value = 0;
  }
});

async function fetchData() {
  try {
    const [systemRes, containerRes, volumeRes, imageRes] = await Promise.all([
      fetch(`${apiUrl.value}/api/system/info`),
      fetch(`${apiUrl.value}/api/containers`),
      fetch(`${apiUrl.value}/api/volumes`),
      fetch(`${apiUrl.value}/api/images`),
    ]);

    const [systemData, containerData, volumeData, imageData] = await Promise.all([
      systemRes.json(),
      containerRes.json(),
      volumeRes.json(),
      imageRes.json(),
    ]);

    if (systemData.success) {
      systemInfo.value = systemData.info;
      error.value = null;
    } else {
      error.value = systemData.error || "Failed to fetch system info";
    }

    if (containerData.success) containers.value = containerData.containers;
    if (volumeData.success) volumes.value = volumeData.volumes || [];
    if (imageData.success) images.value = imageData.images || [];
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchData();
  refreshInterval = setInterval(fetchData, 30000);
});

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval);
});
</script>

<template>
  <div class="relative group h-full flex flex-col rounded-xl bg-white dark:bg-[#0A0A0A] overflow-hidden transition-all duration-400 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-black/5 dark:hover:shadow-black/40">
    <div class="absolute inset-x-0 top-0 h-0.5 bg-blue-500 opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>

    <div v-if="loading" class="relative z-10 flex min-h-56 flex-1 flex-col items-center justify-center p-6">
      <div class="mb-3 h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
      <span class="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-zinc-500">{{ t("quickMetrics.hostMetrics.scanningHost") }}</span>
    </div>

    <div v-else-if="error" class="relative z-10 flex min-h-56 flex-1 flex-col items-center justify-center p-6 text-center">
      <div class="w-full rounded-xl border border-red-200 bg-red-50 p-4 text-red-600 dark:border-red-900/50 dark:bg-red-500/10 dark:text-red-400">
        <span class="mb-1 block text-[10px] font-bold uppercase tracking-widest">{{ t("quickMetrics.hostMetrics.connectionFailed") }}</span>
        <span class="line-clamp-2 text-xs opacity-80 wrap-break-word">{{ error }}</span>
      </div>
    </div>

    <div v-else class="relative z-10 flex h-full flex-col p-6">
      <div class="flex items-start justify-between gap-4">
        <div class="flex items-center gap-3 min-w-0">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-muted)] transition-all duration-500 group-hover:translate-y-[-1px]">
            <Server class="h-5 w-5 text-[var(--text-secondary)] transition-colors group-hover:text-blue-500" />
          </div>
          <div class="min-w-0">
            <div class="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-zinc-500">{{ t("quickMetrics.hostMetrics.hostSystem") }}</div>
            <h3 class="mt-1 truncate text-sm font-semibold tracking-tight text-gray-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">{{ greeting }}</h3>
          </div>
        </div>

        <div class="flex shrink-0 items-center gap-2">
          <span class="relative flex h-2 w-2">
            <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60"></span>
            <span class="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
          </span>
          <span class="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">{{ t("quickMetrics.hostMetrics.online") }}</span>
        </div>
      </div>

      <div class="mt-6">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <div class="min-w-0">
            <div class="truncate text-3xl font-semibold tracking-tight text-gray-900 dark:text-white" :title="osInfo.name">{{ osInfo.name }}</div>
            <p class="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500 dark:text-zinc-400">{{ t("home.overviewPulseCard.stackRunningSmoothly") }}</p>
          </div>
          <div class="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500 sm:text-right">
            <span>{{ t("quickMetrics.hostMetrics.kernel", { kernel: osInfo.kernel }) }}</span>
            <span class="font-mono">{{ osInfo.arch }}</span>
          </div>
        </div>
      </div>

      <div class="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div
          v-for="stat in hostStats"
          :key="stat.key"
          class="flex min-w-0 items-start justify-between rounded-xl bg-[var(--surface-muted)] px-4 py-4"
        >
          <div class="min-w-0">
            <div class="flex items-center gap-2 text-gray-500 dark:text-zinc-400">
              <component :is="stat.icon" :class="['h-3.5 w-3.5 shrink-0', stat.tone]" />
              <span class="truncate text-[10px] font-bold uppercase tracking-[0.18em]">{{ stat.label }}</span>
            </div>
            <div class="mt-3 flex items-end gap-2">
              <span class="truncate text-2xl font-semibold tracking-tight text-gray-900 dark:text-white tabular-nums">{{ stat.value }}</span>
              <span v-if="stat.suffix" class="pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">{{ stat.suffix }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-auto pt-6">
        <div class="rounded-xl bg-[var(--surface-muted)] px-4 py-4">
          <div class="flex items-center justify-between gap-3">
            <div class="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-zinc-500">Stack Overview</div>
            <div class="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500">
              {{ t("home.overviewPulseCard.healthy") }} · {{ t("home.overviewPulseCard.active") }}
            </div>
          </div>

          <div class="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
            <div
              v-for="stat in overviewStats"
              :key="stat.key"
              class="min-w-0"
            >
              <div class="flex items-center gap-2 text-gray-500 dark:text-zinc-400">
                <component :is="stat.icon" :class="['h-3.5 w-3.5 shrink-0', stat.tone]" />
                <span class="truncate text-[9px] font-bold uppercase tracking-widest">{{ stat.label }}</span>
              </div>
              <div class="mt-2 text-xl font-semibold tracking-tight text-gray-900 dark:text-white tabular-nums">{{ stat.value }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@media (prefers-reduced-motion: reduce) {
  .animate-ping {
    animation: none !important;
  }
}
</style>