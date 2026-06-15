<template>
  <article class="stat">
    <span>{{ props.label }}</span>
    <strong>{{ props.value }}</strong>
  </article>
</template>

<script setup lang="ts">
const props = defineProps<{
  label: string
  value: number
}>()
</script>

<style src="./Stat.css"></style>
