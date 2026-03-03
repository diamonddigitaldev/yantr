<script setup>
import { Heart, ArrowUpRight, MessageCircle, Zap, Star } from "lucide-vue-next";

const perks = [
  { icon: MessageCircle, text: "1-on-1 support with core devs" },
  { icon: Zap,           text: "Priority feature requests" },
  { icon: Star,          text: "Sponsor badge in the project" },
];
</script>

<template>
  <div class="group relative flex flex-col h-full rounded-3xl overflow-hidden bg-white dark:bg-zinc-950 shadow-xl shadow-black/5 dark:shadow-black/40 border border-black/5 dark:border-white/6 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-violet-500/10 dark:hover:shadow-violet-500/10">

    <!-- Ambient glow blob -->
    <div class="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-violet-400/20 dark:bg-violet-600/15 blur-3xl pointer-events-none transition-all duration-700 group-hover:scale-125 group-hover:bg-violet-400/30 dark:group-hover:bg-violet-600/25"></div>
    <div class="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-indigo-400/10 dark:bg-indigo-600/10 blur-2xl pointer-events-none"></div>

    <div class="relative z-10 flex flex-col h-full p-6">

      <!-- Icon + label -->
      <div class="flex items-center gap-3 mb-5">
        <div class="w-10 h-10 rounded-2xl bg-linear-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30 transition-transform duration-500 group-hover:scale-105 group-hover:rotate-3">
          <Heart class="w-5 h-5 text-white" />
        </div>
        <div>
          <p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-500 dark:text-violet-400 leading-none mb-0.5">Sponsor</p>
          <p class="text-[10px] text-gray-400 dark:text-zinc-500 leading-none">Open source</p>
        </div>
      </div>

      <!-- Headline -->
      <h3 class="text-[1.05rem] font-bold text-gray-900 dark:text-white tracking-tight leading-tight mb-1.5">
        Back the project.<br />
        <span class="text-transparent bg-clip-text bg-linear-to-r from-violet-500 to-indigo-500">Shape its future.</span>
      </h3>
      <p class="text-[11.5px] text-gray-500 dark:text-zinc-500 leading-relaxed mb-5">
        Sponsors keep Yantr free, fast, and actively maintained for everyone.
      </p>

      <!-- Perks -->
      <ul class="grid grid-cols-2 gap-2.5 mb-6">
        <li
          v-for="perk in perks"
          :key="perk.text"
          class="flex items-center gap-3"
        >
          <div class="shrink-0 w-6 h-6 rounded-xl bg-violet-50 dark:bg-violet-950/60 flex items-center justify-center">
            <component :is="perk.icon" class="w-3 h-3 text-violet-500" />
          </div>
          <span class="text-xs text-gray-600 dark:text-zinc-400 leading-tight font-medium">{{ perk.text }}</span>
        </li>
      </ul>

      <!-- CTA -->
      <div class="mt-auto">
        <a
          href="https://sponsor.besoeasy.com/"
          target="_blank"
          rel="noopener noreferrer"
          class="group/cta flex items-center justify-between w-full px-4 py-3 rounded-2xl bg-gray-950 dark:bg-white text-white dark:text-gray-950 transition-all duration-300 hover:opacity-90 active:scale-[0.98] shadow-lg shadow-gray-950/20 dark:shadow-white/10"
        >
          <div class="flex items-center gap-2">
            <Heart class="w-3.5 h-3.5 transition-all duration-300 group-hover/cta:fill-current" />
            <span class="text-xs font-semibold tracking-tight">Become a Sponsor</span>
          </div>
          <ArrowUpRight class="w-3.5 h-3.5 opacity-60 transition-all duration-300 group-hover/cta:opacity-100 group-hover/cta:translate-x-0.5 group-hover/cta:-translate-y-0.5" />
        </a>
      </div>

    </div>
  </div>
</template>


