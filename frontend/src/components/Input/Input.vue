<template>
  <label class="input-field">
    <span>{{ props.label }}</span>
    <input
      v-model="model"
      :type="props.type"
      :autocomplete="props.autocomplete"
      :placeholder="props.placeholder"
    />

    <small v-if="props.error">{{ props.error }}</small>
  </label>
</template>

<script setup lang="ts">
const model = defineModel<string>({
  default: '',
})

const props = defineProps<{
  label: string
  type: string
  autocomplete: string
  placeholder: string
  error?: string
}>()
</script>

<style src="./Input.css"></style>
