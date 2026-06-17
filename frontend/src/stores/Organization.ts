import { defineStore } from 'pinia'
import { fetchPost, fetchGet } from '@/utils/Fetch'
import type { organisation } from '@/types/organisation'
import { getXsrfToken } from '@/utils/getXSRF'
import { ref } from 'vue'

interface CreateOrganizationData {
  yandex_url: string
}

interface CreateOrganizationResponse {
  organization: organisation
}

interface GetAllOrganizationResponse {
  organizations: organisation[]
}

interface GetOneOrganizationResponse {
  organization: organisation
}

export const storeOrganization = defineStore('organization', () => {
  const loading = ref<boolean>(false)
  const organisation = ref<organisation | null>(null)
  const allOrganisations = ref<organisation[]>([])
  const error = ref<string | null>(null)
  const notification = ref<string | null>(null)
  let pollingTimer: ReturnType<typeof setInterval> | null = null

  const getOneOrganization = async (id: number): Promise<organisation | null> => {
    try {
      const response = await fetch(`/api/organization/${id}`, {
        credentials: 'include',
        headers: {
          Accept: 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Не удалось обновить данные организации')
      }

      if (response.status === 404) {
        return null
      }

      const data = (await response.json()) as GetOneOrganizationResponse

      organisation.value = data.organization

      const index = allOrganisations.value.findIndex((item) => item.id === id)

      if (index !== -1) {
        allOrganisations.value[index] = data.organization
      }

      return data.organization
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Неизвестная ошибка'
      return null
    }
  }

  const startPollingOrganization = (
    id: number,
    onReady?: (organization: organisation) => void,
  ): void => {
    if (pollingTimer) {
      clearInterval(pollingTimer)
    }

    pollingTimer = setInterval(async () => {
      notification.value = 'Организация добавлена, выполняется парсинг отзывов и рейтинга'
      const organization = await getOneOrganization(id)

      if (!organization) {
        clearInterval(pollingTimer!)
        pollingTimer = null
        return
      }

      if (organization?.name && Number(organization.reviews_count) > 0) {
        clearInterval(pollingTimer!)
        pollingTimer = null
        onReady?.(organization)

        notification.value = null
      }
    }, 3000)
  }

  const createOrganization = async (yandexUrl: string): Promise<boolean> => {
    error.value = null

    try {
      const token = getXsrfToken()
      const data = await fetchPost<CreateOrganizationData, CreateOrganizationResponse>(
        loading,
        '/api/organizations',
        { yandex_url: yandexUrl },
        token,
      )

      organisation.value = data.organization
      startPollingOrganization(data.organization.id)

      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Неизвестная ошибка'

      return false
    }
  }

  const getAllOrganisations = async (): Promise<boolean> => {
    error.value = null

    try {
      const data = await fetchGet<GetAllOrganizationResponse>(loading, '/api/organizations')

      allOrganisations.value = data.organizations

      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Неизвестная ошибка'

      return false
    }
  }

  return {
    loading,
    organisation,
    error,
    allOrganisations,
    notification,
    startPollingOrganization,
    getOneOrganization,
    createOrganization,
    getAllOrganisations,
  }
})
