<template>
  <article class="review">
    <header class="review__header">
      <div>
        <h3>{{ props.author }}</h3>
        <time>{{ props.date }}</time>
      </div>

      <span class="review__rating">{{ props.rating }} ★</span>
    </header>

    <p>{{ props.text }}</p>
  </article>
</template>

<script setup lang="ts">
const props = defineProps<{
  author: string
  date: string
  rating: number
  text: string | null
}>()
</script>

<style src="./Review.css"></style>
