<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { setupGlobalRevalidate } from '@/utils/appSync';

let cleanupRevalidate: (() => void) | null = null;

onMounted(() => {
  cleanupRevalidate = setupGlobalRevalidate();
});

onUnmounted(() => {
  if (cleanupRevalidate) cleanupRevalidate();
});
</script>