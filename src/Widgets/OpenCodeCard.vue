<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { ArrowUpRight, Bot, ChevronRight, PackagePlus } from "lucide-vue-next";
import { useApiUrl } from "../composables/useApiUrl";

const router = useRouter();
const { apiUrl } = useApiUrl();
const opencodePort = ref(null);
const opencodeInstalled = ref(false);

const isRunning = computed(() => Boolean(opencodePort.value));

const statusLabel = computed(() => {
  if (isRunning.value) return `Live on port ${opencodePort.value}`;
  if (opencodeInstalled.value) return "Installed locally";
  return "Ready to install";
});

const statusDescription = computed(() => {
  if (isRunning.value) return "Open the workspace and manage apps from chat.";
  if (opencodeInstalled.value) return "The app is installed, but no host port is published yet.";
  return "Install the Yantr build to start creating and updating apps with prompts.";
});

const primaryLabel = computed(() => {
  if (isRunning.value || opencodeInstalled.value) return "Open OpenCode";
  return "Install OpenCode Yantr";
});

const primaryIcon = computed(() => (isRunning.value || opencodeInstalled.value ? ArrowUpRight : PackagePlus));

const primaryDescription = computed(() => {
  if (isRunning.value) return "Launch the active workspace";
  if (opencodeInstalled.value) return "Open the install page and finish setup";
  return "Go to the app page to install and configure it";
});

const statusTone = computed(() => {
  if (isRunning.value) {
    return {
      dot: "bg-emerald-500",
      text: "text-emerald-700 dark:text-emerald-400",
    };
  }

  if (opencodeInstalled.value) {
    return {
      dot: "bg-amber-500",
      text: "text-amber-700 dark:text-amber-400",
    };
  }

  return {
    dot: "bg-sky-500",
    text: "text-sky-700 dark:text-sky-400",
  };
});

onMounted(async () => {
  try {
    const res = await fetch(`${apiUrl.value}/api/containers`);
    const data = await res.json();
    if (data.success) {
      const matchingContainers = data.containers.filter(
        (c) => c.app?.id === "opencode-yantr"
      );
      opencodeInstalled.value = matchingContainers.length > 0;

      const runningContainer = matchingContainers.find((c) => c.state === "running");
      if (runningContainer) {
        const port = runningContainer.ports?.find((p) => p.PrivatePort === 4096 && p.PublicPort);
        if (port) opencodePort.value = port.PublicPort;
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
    @keydown.enter.prevent="openOpenCode"
    @keydown.space.prevent="openOpenCode"
    class="opencode-card group relative flex h-full cursor-pointer flex-col rounded-2xl p-5 sm:p-6 smooth-shadow transition-all duration-300 hover:-translate-y-1 hover:smooth-shadow-lg"
    style="background: var(--surface)"
    role="button"
    tabindex="0"
  >
    <div class="relative z-10 flex items-start justify-between gap-4">
      <div class="flex items-center gap-4 min-w-0">
        <div class="opencode-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
          <Bot class="h-5 w-5" style="color: var(--text-primary)" />
        </div>

        <div class="min-w-0">
          <h3 class="text-sm font-semibold tracking-tight transition-colors duration-300" style="color: var(--text-primary)">
            OpenCode
          </h3>
          <div class="mt-1 flex items-center gap-2 min-w-0">
            <span class="h-1.5 w-1.5 shrink-0 rounded-full status-dot" :class="statusTone.dot"></span>
            <span class="text-[11px] font-medium uppercase tracking-[0.14em] truncate" style="color: var(--text-secondary)">
              {{ statusLabel }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="relative z-10 flex-1 flex flex-col justify-end gap-5 pt-6">
      <div class="group/hero">
        <div class="text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style="color: var(--text-secondary)">
          Prompt to workflow
        </div>
        <div class="opencode-hero text-3xl font-bold tracking-tight leading-none" style="color: var(--text-primary)">
          Chat builds apps.
        </div>
      </div>

      <div class="grid grid-cols-1 gap-3">
        <div class="flex items-start gap-3">
          <span class="mt-1 h-2 w-2 shrink-0 rounded-full" :class="statusTone.dot"></span>
          <div class="min-w-0">
            <div class="text-[9px] font-bold uppercase tracking-[0.18em]" style="color: var(--text-secondary)">
              Workflow
            </div>
            <p class="mt-1 text-xs font-medium leading-relaxed" style="color: var(--text-primary)">
              Describe the app you want in chat and turn it into an installable Yantr workflow.
            </p>
          </div>
        </div>

        <div class="flex items-start gap-3">
          <span class="mt-1 h-2 w-2 shrink-0 rounded-full" :class="statusTone.dot"></span>
          <div class="min-w-0">
            <div class="text-[9px] font-bold uppercase tracking-[0.18em]" style="color: var(--text-secondary)">
              Status
            </div>
            <p class="opencode-copy mt-1 text-xs font-medium leading-relaxed" style="color: var(--text-primary)">
              {{ statusDescription }}
            </p>
          </div>
        </div>
      </div>

      <button
        type="button"
        @click.stop="openOpenCode"
        class="group/btn opencode-cta flex min-h-12 w-full items-center justify-between rounded-xl px-0 py-2 text-left transition-all duration-300"
      >
        <div class="flex min-w-0 items-center gap-3">
          <div
            class="opencode-cta-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover/btn:-translate-y-0.5 group-hover/btn:scale-105"
            :class="statusTone.text"
          >
            <component :is="primaryIcon" class="h-4 w-4" />
          </div>

          <div class="min-w-0">
            <div class="text-sm font-semibold transition-transform duration-300 group-hover/btn:translate-x-0.5" style="color: var(--text-primary)">
              {{ primaryLabel }}
            </div>
            <div class="text-[11px] leading-relaxed" style="color: var(--text-secondary)">
              {{ primaryDescription }}
            </div>
          </div>
        </div>
        <ChevronRight class="opencode-arrow h-4 w-4 shrink-0 transition-all duration-300 group-hover/btn:translate-x-1 group-hover/btn:opacity-100" style="color: var(--text-secondary)" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.opencode-card {
  overflow: hidden;
}

.opencode-card:hover h3 {
  color: color-mix(in srgb, var(--text-primary) 78%, #2563eb 22%);
}

.opencode-icon {
  transition: transform var(--yantra-dur) var(--yantra-ease), opacity var(--yantra-dur) var(--yantra-ease);
  opacity: 0.86;
}

.opencode-card:hover .opencode-icon {
  transform: translateY(-2px) rotate(-6deg);
  opacity: 1;
}

.opencode-hero {
  transition: transform var(--yantra-dur) var(--yantra-ease), color var(--yantra-dur) var(--yantra-ease);
}

.opencode-card:hover .opencode-hero {
  transform: translateX(4px);
  color: color-mix(in srgb, var(--text-primary) 82%, #2563eb 18%);
}

.opencode-copy {
  opacity: 0.92;
  transition: opacity var(--yantra-dur-fast) var(--yantra-ease), transform var(--yantra-dur) var(--yantra-ease);
}

.opencode-card:hover .opencode-copy {
  opacity: 1;
  transform: translateX(2px);
}

.opencode-cta {
  position: relative;
}

.opencode-arrow {
  opacity: 0.55;
}

@media (prefers-reduced-motion: reduce) {
  .opencode-card,
  .opencode-icon,
  .opencode-hero,
  .opencode-copy,
  .opencode-cta,
  .opencode-arrow {
    transition: none !important;
  }
}
</style>
