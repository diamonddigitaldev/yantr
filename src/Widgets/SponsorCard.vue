<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { MessageCircle, Zap, GitPullRequest, ShieldCheck, ArrowUpRight, Github } from "lucide-vue-next";

const { t } = useI18n();

const benefits = computed(() => [
  { icon: MessageCircle, title: t("sponsorCard.benefits.devAccess.title") },
  { icon: Zap, title: t("sponsorCard.benefits.roadmap.title") },
  { icon: GitPullRequest, title: t("sponsorCard.benefits.earlyBuilds.title") },
  { icon: ShieldCheck, title: t("sponsorCard.benefits.badge.title") },
]);
</script>

<template>
  <div class="group h-full flex flex-col bg-white dark:bg-[#0A0A0A] rounded-xl p-5 transition-all duration-300 hover:-translate-y-0.5 smooth-shadow">
    <!-- Header -->
    <div class="flex items-start gap-3 mb-4">
      <div class="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
        <Github class="w-5 h-5 text-gray-800 dark:text-white" />
      </div>
      <div class="min-w-0">
        <div class="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 dark:text-zinc-500">{{ t('sponsorCard.label') }}</div>
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white leading-snug mt-0.5">{{ t('sponsorCard.title') }}</h3>
      </div>
    </div>

    <!-- Description -->
    <p class="text-[11px] leading-relaxed text-gray-500 dark:text-zinc-400 mb-4">
      {{ t('sponsorCard.description') }}
    </p>

    <!-- Benefits -->
    <ul class="flex-1 flex flex-col gap-2 mb-5">
      <li
        v-for="benefit in benefits"
        :key="benefit.title"
        class="flex items-center gap-2 text-[11px] text-gray-600 dark:text-zinc-400"
      >
        <component :is="benefit.icon" class="w-3.5 h-3.5 shrink-0 text-amber-500" />
        <span>{{ benefit.title }}</span>
      </li>
    </ul>

    <!-- CTA -->
    <a
      href="https://github.com/sponsors/besoeasy"
      target="_blank"
      rel="noopener noreferrer"
      :aria-label="t('sponsorCard.cta')"
      class="group/cta flex items-center justify-between w-full px-4 py-3 rounded-lg bg-gray-950 dark:bg-white text-white dark:text-gray-950 transition-all duration-300 hover:bg-gray-800 dark:hover:bg-gray-100 active:scale-[0.98]"
    >
      <span class="flex items-center gap-2">
        <Github class="w-4 h-4 shrink-0 opacity-80" />
        <span class="text-xs font-bold tracking-tight">{{ t('sponsorCard.cta') }}</span>
      </span>
      <ArrowUpRight class="w-4 h-4 opacity-40 transition-all duration-300 group-hover/cta:opacity-100 group-hover/cta:translate-x-0.5 group-hover/cta:-translate-y-0.5" />
    </a>
  </div>
</template>
