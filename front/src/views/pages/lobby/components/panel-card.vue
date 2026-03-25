<template>
  <section class="rounded-[28px] border border-slate-200/70 bg-white/88 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.10)] backdrop-blur-xl sm:p-5">
    <div v-if="title || subtitle || $slots.action" class="mb-4 flex items-start justify-between gap-3">
      <div>
        <p v-if="title" class="text-base font-semibold text-slate-900">
          {{ title }}
        </p>
        <p v-if="subtitle" class="mt-1 text-sm text-slate-500">
          {{ subtitle }}
        </p>
      </div>
      <div v-if="$slots.action" class="shrink-0">
        <slot name="action" />
      </div>
    </div>

    <slot />
  </section>
</template>

<script setup lang="ts">
defineProps<{
  title?: string
  subtitle?: string
}>();
</script>
