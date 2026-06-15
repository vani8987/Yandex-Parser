<template>
  <Transition name="notification">
    <div v-if="props.message" class="notification" role="status">
      {{ props.message }}
    </div>
  </Transition>
</template>

<script setup lang="ts">
const props = defineProps<{
  message: string | null
}>()
</script>

<style src="./Notification.css"></style>
