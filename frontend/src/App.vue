<template>
  <div class="app">
    <Loader v-if="authStore.loading" />
    <Notification :message="authStore.message" />
    <RouterView />
  </div>
</template>

<script setup lang="ts">
import Notification from '@/components/Notification/Notification.vue'
import Loader from '@/components/Loader/Loader.vue'
import { AuthStore } from '@/stores/Auth'


const authStore = AuthStore()


</script>
