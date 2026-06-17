import { defineStore } from 'pinia'
import type { User } from '@/types/user'
import { fetchGet, fetchPost } from '@/utils/Fetch'
import { ref } from 'vue'
import { getXsrfToken } from '@/utils/getXSRF'

interface LoginData {
  email: string
  password: string
}

interface LoginResponse {
  user: User
}

interface LogoutResponse {
  message: string
}

export const AuthStore = defineStore('Auth', () => {
  const user = ref<User | null>(null)
  const message = ref<string | null>(null)
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)

  const login = async (dataObj: LoginData): Promise<boolean> => {
    error.value = null

    try {
      await fetch('/sanctum/csrf-cookie', {
        credentials: 'include',
      })

      const token = getXsrfToken()

      const data = await fetchPost<LoginData, LoginResponse>(loading, '/api/login', dataObj, token)

      user.value = data.user

      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Неизвестная ошибка'

      return false
    }
  }

  const logout = async (): Promise<boolean> => {
    try {
      const token = getXsrfToken()

      const data = await fetchPost<undefined, LogoutResponse>(
        loading,
        '/api/logout',
        undefined,
        token,
      )

      user.value = null
      message.value = data.message

      window.setTimeout(() => {
        message.value = null
      }, 3000)

      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Неизвестная ошибка'

      return false
    }
  }

  const me = async (): Promise<boolean> => {
    try {
      const data = await fetchGet<LoginResponse>(loading, '/api/me')

      user.value = data.user

      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Неизвестная ошибка'
      user.value = null

      return false
    }
  }

  return {
    user,
    message,
    loading,
    error,
    login,
    logout,
    me,
  }
})
