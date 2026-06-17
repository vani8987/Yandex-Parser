<template>
  <div>
    <Loader v-if="authStore.loading" />

    <main class="login-page">
      <Form @submit.prevent="handleSubmit">
        <template #header>
          <h1>Вход</h1>
          <p>Войдите в аккаунт для работы с отзывами.</p>
        </template>

        <Input
          :label="'Email'"
          :type="'email'"
          :autocomplete="'email'"
          :placeholder="'name@example.com'"
          :error="errors.email"
          @input="handleEmailInput"
          v-model="formLogin.email"
        />

        <Input
          :label="'Пароль'"
          :type="'password'"
          :autocomplete="'current-password'"
          :placeholder="'Введите пароль'"
          @input="handlePasswordInput"
          :error="errors.password"
          v-model="formLogin.password"
        />

        <p v-if="authStore.error" class="login-error">{{ authStore.error }}</p>

        <Button :text="'Войти'" :type="'submit'" />
      </Form>
    </main>
  </div>
</template>

<script setup lang="ts">
import Button from '@/components/Button/Button.vue'
import Form from '@/components/Form/Form.vue'
import Input from '@/components/Input/Input.vue'
import Loader from '@/components/Loader/Loader.vue'
import { AuthStore } from '@/stores/Auth'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const authStore = AuthStore()
const router = useRouter()

interface loginFormDate {
  password: string
  email: string
}

const formLogin = ref<loginFormDate>({
  password: '',
  email: '',
})

const errors = ref<Partial<loginFormDate>>({})

function validateEmail(value: string): string {
  if (!value.trim()) {
    return 'Введите email'
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return 'Введите корректный email'
  }

  return ''
}

function validatePassword(value: string): string {
  if (!value) {
    return 'Введите пароль'
  }

  if (value.length < 8) {
    return 'Пароль должен содержать минимум 8 символов'
  }

  return ''
}

const handleEmailInput = () => {
  errors.value.email = validateEmail(formLogin.value.email)
}

const handlePasswordInput = () => {
  errors.value.password = validatePassword(formLogin.value.password)
}

const handleSubmit = async () => {
  errors.value.email = validateEmail(formLogin.value.email)
  errors.value.password = validatePassword(formLogin.value.password)

  if (errors.value.email || errors.value.password) {
    return
  }

  const isLoggedIn = await authStore.login(formLogin.value)

  if (isLoggedIn) {
    await router.push('/settings')
  }
}
</script>

<style src="./Login.css"></style>
