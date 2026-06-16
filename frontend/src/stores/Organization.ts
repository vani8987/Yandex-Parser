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

export const storeOrganization = defineStore('organization', () => {
  const loading = ref<boolean>(false)
  const organisation = ref<organisation | null>(null)
  const allOrganisations = ref<organisation[]>([])
  const error = ref<string | null>(null)

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

      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Неизвестная ошибка'

      return false
    }
  }

  const getAllOrganisations = async (): Promise<boolean> => {
    error.value = null

    try {
      const data = await fetchGet<GetAllOrganizationResponse>(
        loading,
        '/api/organizations',
      )

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
    createOrganization,
    getAllOrganisations,
  }
})
