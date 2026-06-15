<template>
  <section class="form-card">
    <header class="form-card__header">
      <slot name="header"></slot>
    </header>

    <form class="form-card__form" @submit="$emit('submit', $event)">
      <slot></slot>
    </form>

    <footer class="form-card__footer">
      <slot name="footer"></slot>
    </footer>
  </section>
</template>

<script setup lang="ts">
defineEmits<{
  submit: [event: SubmitEvent]
}>()
</script>

<style src="./Form.css"></style>
