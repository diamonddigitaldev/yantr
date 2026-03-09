<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { Bot, ExternalLink, Sparkles } from "lucide-vue-next";
import { useApiUrl } from "../../composables/useApiUrl";

const router = useRouter();
const { apiUrl } = useApiUrl();
const opencodePort = ref(null);

onMounted(async () => {
  try {
    const res = await fetch(`${apiUrl.value}/api/containers`);
    const data = await res.json();
    if (data.success) {
      const container = data.containers.find(
        (c) => c.Labels?.["yantr.app"] === "opencode-yantr" && c.state === "running"
      );
      if (container) {
        const port = container.ports?.find((p) => p.privatePort === 4096 && p.publicPort);
        if (port) opencodePort.value = port.publicPort;
      }
    }
  } catch {
    // not installed — card still renders
  }
});

function openOpenCode() {
  if (opencodePort.value) {
    window.open(`http://${window.location.hostname}:${opencodePort.value}`, "_blank");
  } else {
    router.push("/apps/opencode-yantr");
  }
}
</script>

<template>
  <div
    @click="openOpenCode"
    class="group relative flex flex-col h-full bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-zinc-800 rounded-xl p-5 overflow-hidden cursor-pointer hover:shadow-2xl hover:shadow-black/5 dark:hover:shadow-black/40 hover:-translate-y-1 hover:border-purple-300 dark:hover:border-purple-500/40 transition-all duration-300"
  >
    <!-- Gradient top accent -->
    <div class="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

    <!-- Header -->
    <div class="flex items-start justify-between mb-4">
      <div class="w-12 h-12 rounded-lg bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20 flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-105">
        <Bot :size="24" class="text-purple-500 dark:text-purple-400" />
      </div>

      <div
        v-if="opencodePort"
        class="flex items-center gap-1.5 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500/20 px-2 py-1.5 rounded-full"
      >
        <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0"></div>
        <span class="text-[11px] font-bold tracking-wide uppercase">Running</span>
      </div>
      <div
        v-else
        class="flex items-center gap-1.5 bg-gray-50 dark:bg-zinc-900 text-gray-400 dark:text-zinc-500 border border-gray-200 dark:border-zinc-800 px-2 py-1.5 rounded-full"
      >
        <span class="text-[11px] font-bold tracking-wide uppercase">Not Installed</span>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 flex flex-col">
      <div class="flex items-center gap-2 mb-1.5">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white tracking-tight group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300">
          AI App Manager
        </h3>
        <Sparkles :size="14" class="text-purple-400 shrink-0" />
      </div>

      <p class="text-sm text-gray-500 dark:text-zinc-400 leading-relaxed font-medium mb-6">
        Deploy and manage apps using AI. Just describe what you want in chat — OpenCode handles the rest.
      </p>

      <div class="mt-auto pt-4 border-t border-gray-100 dark:border-zinc-800/80 flex items-center justify-between">
        <span class="text-[11px] font-bold uppercase tracking-wider text-purple-500 dark:text-purple-400">
          Powered by OpenCode
        </span>
        <div class="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-semibold text-xs">
          <span>{{ opencodePort ? "Open" : "Install" }}</span>
          <ExternalLink :size="14" class="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
        </div>
      </div>
    </div>
  </div>
</template>
