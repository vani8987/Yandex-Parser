import { defineStore } from 'pinia'
import { ref } from 'vue'

import type { Review } from '@/types/review'
import { fetchGet } from '@/utils/Fetch'

interface ReviewsPagination {
  data: Review[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

interface GetReviewsResponse {
  reviews: ReviewsPagination
}

export const storeReviews = defineStore('reviews', () => {
  const loading = ref<boolean>(false)
  const reviews = ref<Review[]>([])
  const error = ref<string | null>(null)
  const currentPage = ref<number>(1)
  const lastPage = ref<number>(1)
  const total = ref<number>(0)
  const reviewsPerPage = ref<number>(50)

  const getReviews = async (
    organizationId: number,
    page = 1,
    reviewsPerPage = 50,
  ): Promise<boolean> => {
    error.value = null

    try {
      const response = await fetchGet<GetReviewsResponse>(
        loading,
        `/api/organizations/${organizationId}/reviews?page=${page}&count=${reviewsPerPage}`,
      )

      reviews.value = response.reviews.data
      currentPage.value = response.reviews.current_page
      lastPage.value = response.reviews.last_page
      total.value = response.reviews.total

      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Неизвестная ошибка'

      return false
    }
  }

  return {
    loading,
    reviews,
    error,
    currentPage,
    lastPage,
    total,
    getReviews,
    reviewsPerPage,
  }
})
