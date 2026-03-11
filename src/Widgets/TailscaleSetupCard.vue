<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Shield, ArrowRight, Key, CheckCircle, AlertCircle, Loader, Lock, Globe } from 'lucide-vue-next'
import { useApiUrl } from '../composables/useApiUrl'

const { apiUrl } = useApiUrl()
const { t } = useI18n()

const authKey = ref('')
const deploying = ref(false)
const deployError = ref('')
const deploySuccess = ref(false)

const features = [
  { icon: Lock, label: t('tailscaleSetupCard.wireGuardE2E') },
  { icon: Globe, label: t('tailscaleSetupCard.zeroPortForward') },
  { icon: Shield, label: t('tailscaleSetupCard.worksBehindCgnat') },
]

const isValidToken = computed(() => {
  const k = authKey.value.trim()
  if (!k.startsWith('tskey-')) return false
  if (k.length < 30) return false
  if (/\s/.test(k)) return false
  return true
})

const tokenState = computed(() => {
  const k = authKey.value.trim()
  if (!k) return 'empty'
  if (isValidToken.value) return 'valid'
  return 'invalid'
})

async function deploy() {
  if (!isValidToken.value || deploying.value) return
  deploying.value = true
  deployError.value = ''
  try {
    const res = await fetch(`${apiUrl.value}/api/deploy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appId: 'tailscale',
        environment: { TAILSCALE_AUTH_KEY: authKey.value.trim() },
      }),
    })
    const data = await res.json()
    if (!res.ok || !data.success) {
      deployError.value = data.error || data.message || t('tailscaleSetupCard.deploymentFailed')
    } else {
      deploySuccess.value = true
    }
  } catch (e) {
    deployError.value = e.message || t('tailscaleSetupCard.networkError')
  } finally {
    deploying.value = false
  }
}
</script>

<template>
  <div class="relative group h-full flex flex-col bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-black/5 dark:hover:shadow-black/40 hover:border-gray-300 dark:hover:border-zinc-600 hover:-translate-y-0.5">
    <div class="absolute top-0 left-0 w-full h-0.5 bg-linear-to-r from-transparent via-violet-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

    <transition
      enter-active-class="transition-all duration-500 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
    >
      <div v-if="deploySuccess" class="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/95 dark:bg-[#0A0A0A]/95 rounded-xl gap-3">
        <div class="w-12 h-12 rounded-full bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 flex items-center justify-center">
          <CheckCircle class="w-6 h-6 text-green-600 dark:text-green-500" />
        </div>
        <div class="text-center">
          <p class="text-sm font-semibold text-gray-900 dark:text-white tracking-tight">{{ t('tailscaleSetupCard.tailscaleDeployed') }}</p>
          <p class="text-[11px] text-gray-500 dark:text-zinc-400 mt-1 uppercase tracking-widest font-medium">{{ t('tailscaleSetupCard.containerStarting') }}</p>
        </div>
      </div>
    </transition>

    <div class="relative z-10 p-6 flex flex-col h-full gap-5">
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-10 h-10 rounded-lg bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-all duration-500">
            <Shield class="w-5 h-5 text-violet-500" />
          </div>
          <div class="min-w-0">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white tracking-tight">{{ t('tailscaleSetupCard.tailscale') }}</h3>
            <div class="text-[11px] font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider mt-1">{{ t('tailscaleSetupCard.meshVpn') }}</div>
          </div>
        </div>
        <div class="shrink-0 flex items-center gap-1.5">
          <div class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
          <span class="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">{{ t('tailscaleSetupCard.notInstalled') }}</span>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div
          v-for="feature in features"
          :key="feature.label"
          class="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-gray-600 dark:border-zinc-800/50 dark:bg-zinc-900/50 dark:text-zinc-300"
        >
          <component :is="feature.icon" class="h-3.5 w-3.5 shrink-0 text-violet-500" />
          <span class="text-[11px] font-medium leading-tight">{{ feature.label }}</span>
        </div>
      </div>

      <div class="flex flex-col gap-3 flex-1">
        <div>
          <label class="block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-zinc-500 mb-2">{{ t('tailscaleSetupCard.authKey') }}</label>
          <div class="relative">
            <input
              v-model="authKey"
              type="text"
              :placeholder="t('tailscaleSetupCard.authKeyPlaceholder')"
              autocomplete="off"
              spellcheck="false"
              class="w-full bg-gray-50 dark:bg-zinc-900 border rounded-lg px-3 py-2.5 text-xs font-mono text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-600 outline-none transition-all duration-200 pr-8"
              :class="{
                'border-gray-200 dark:border-zinc-800 focus:border-violet-400 dark:focus:border-violet-500 focus:ring-1 focus:ring-violet-400/20': tokenState === 'empty',
                'border-green-300 dark:border-green-600 focus:border-green-400': tokenState === 'valid',
                'border-red-300 dark:border-red-700 focus:border-red-400': tokenState === 'invalid',
              }"
            />
            <div class="absolute right-2.5 top-1/2 -translate-y-1/2 transition-all duration-200">
              <CheckCircle v-if="tokenState === 'valid'" class="w-3.5 h-3.5 text-green-500" />
              <AlertCircle v-else-if="tokenState === 'invalid'" class="w-3.5 h-3.5 text-red-400" />
            </div>
          </div>

          <div class="overflow-hidden">
            <transition
              enter-active-class="transition-all duration-200 ease-out"
              enter-from-class="opacity-0 -translate-y-2 max-h-0"
              enter-to-class="opacity-100 translate-y-0 max-h-6"
              leave-active-class="transition-all duration-150 ease-in"
              leave-from-class="opacity-100 translate-y-0 max-h-6"
              leave-to-class="opacity-0 -translate-y-2 max-h-0"
            >
              <p v-if="tokenState === 'invalid'" class="mt-1.5 text-[11px] text-red-500 dark:text-red-400 font-medium">
                {{ t('tailscaleSetupCard.mustStartWith') }} <span class="font-mono">tskey-</span> {{ t('tailscaleSetupCard.andBeChars') }}
              </p>
              <p v-else-if="tokenState === 'valid'" class="mt-1.5 text-[11px] text-green-600 dark:text-green-400 font-medium">
                {{ t('tailscaleSetupCard.keyLooksValid') }}
              </p>
            </transition>
          </div>
        </div>

        <transition
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="opacity-0 translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition-all duration-150 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 translate-y-1"
        >
          <div v-if="deployError" class="flex items-center gap-2 p-2.5 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20">
            <AlertCircle class="w-3.5 h-3.5 text-red-500 shrink-0" />
            <p class="text-[11px] text-red-600 dark:text-red-400 font-medium">{{ deployError }}</p>
          </div>
        </transition>

        <div class="mt-auto grid grid-cols-1 gap-3 sm:grid-cols-2">
          <a
            href="https://login.tailscale.com/admin/settings/keys"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900/70 text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-zinc-200 transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-300 dark:hover:border-violet-500/40 hover:text-violet-600 dark:hover:text-violet-400"
          >
            <Key class="w-3.5 h-3.5" />
            <span>{{ t('tailscaleSetupCard.getAuthKey') }}</span>
            <ArrowRight class="w-3.5 h-3.5" />
          </a>

          <button
            @click="deploy"
            :disabled="!isValidToken || deploying"
            class="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all duration-200"
            :class="isValidToken && !deploying
              ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 cursor-pointer'
              : 'bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500 cursor-not-allowed'"
          >
            <Loader v-if="deploying" class="w-3.5 h-3.5 animate-spin" />
            <Shield v-else class="w-3.5 h-3.5 transition-transform duration-200" :class="isValidToken ? 'group-hover:scale-110' : ''" />
            <span>{{ deploying ? t('tailscaleSetupCard.deploying') : t('tailscaleSetupCard.deployTailscale') }}</span>
          </button>
        </div>
      </div>

    </div>
  </div>
</template>
