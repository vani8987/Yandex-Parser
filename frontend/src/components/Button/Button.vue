<template>
  <button class="button" :type="props.type" :disabled="props.disabled">
    {{ props.text }}
  </button>
</template>

<script setup lang="ts">
const props = defineProps<{
  text: string
  type: 'button' | 'submit' | 'reset'
  disabled?: boolean
}>()
</script>

<style src="./Button.css"></style>
