<template>
  <main class="settings-page">
    <Loader v-if="organizationStore.loading || reviewsStore.loading" />

    <header class="settings-header">
      <div>
        <span class="settings-header__brand">Review Map</span>
        <h1>Отзывы организации</h1>
      </div>

      <Button :text="'Выйти'" :type="'button'" @click="handleLogout" />
    </header>

    <section class="settings-card">
      <div class="settings-card__heading">
        <h2>Подключение организации</h2>
        <p>Вставьте ссылку на карточку организации в Яндекс Картах.</p>
      </div>

      <label class="organization-select">
        <span>Сохранённые организации</span>

        <select v-model="selectedOrganizationId" @change="handleOrganizationSelect">
          <option selected value="">Выберите организацию</option>

          <option
            v-for="organization in organizationStore.allOrganisations"
            :key="organization.id"
            :value="organization.id"
          >
            {{ organization.name }}
          </option>
        </select>
      </label>

      <form class="organization-form" @submit.prevent="submitUrl">
        <Input
          v-model="url"
          :label="'Ссылка на организацию'"
          :type="'url'"
          :autocomplete="'url'"
          :placeholder="'https://yandex.ru/maps/org/...'"
          :error="urlError"
          @input="heandlerInput"
        />
        <Button :text="'Сохранить'" :type="'submit'" :disabled="!url.trim()" />
      </form>

      <p v-if="organizationStore.error || organizationStore.notification" :class="styleMessage">
        {{ notificationMessage }}
      </p>
    </section>

    <section class="organization" v-if="organizationStore.organisation">
      <div class="organization__heading">
        <div>
          <span>Организация</span>
          <h2>{{ organizationStore.organisation.name }}</h2>
        </div>

        <a :href="organizationStore.organisation.yandex_url" target="_blank"
          >Открыть на Яндекс Картах</a
        >
      </div>

      <div class="stats">
        <Stat :label="'Средний рейтинг'" :value="organizationStore.organisation.rating" />
        <Stat :label="'Количество оценок'" :value="organizationStore.organisation.ratings_count" />
        <Stat :label="'Количество отзывов'" :value="organizationStore.organisation.reviews_count" />
      </div>
    </section>

    <section class="reviews-section" v-if="reviewsStore.reviews.length">
      <div class="reviews-section__heading">
        <div>
          <h2>Отзывы</h2>
          <p>Показано {{ reviewsStore.reviews.length }} из {{ reviewsStore.total }} отзывов</p>
        </div>

        <div class="reviews-section__controls">
          <label class="reviews-limit">
            <span>Отзывов на странице</span>
            <select v-model="reviewsStore.reviewsPerPage" @change="handleReviewsPerPageChange">
              <option :value="10">10</option>
              <option :value="30">30</option>
              <option :value="50">50</option>
            </select>
          </label>
        </div>
      </div>

      <div class="reviews-list">
        <Review
          v-for="review in reviewsStore.reviews"
          :key="review.id"
          :author="review.author"
          :date="review.review_date"
          :rating="review.rating"
          :text="review.text"
        />
      </div>

      <nav class="pagination" aria-label="Навигация по отзывам">
        <button
          type="button"
          :disabled="isFirstPage"
          @click="changePage(reviewsStore.currentPage - 3)"
        >
          −3
        </button>

        <button type="button" :disabled="isFirstPage" @click="undoBtn">Назад</button>

        <button
          v-for="page in visiblePages"
          :key="page"
          type="button"
          :class="{ pagination__active: page === reviewsStore.currentPage }"
          @click="changePage(page)"
        >
          {{ page }}
        </button>

        <button type="button" :disabled="isLastPage" @click="nextBtn">Вперёд</button>

        <button
          type="button"
          :disabled="isLastPage"
          @click="changePage(reviewsStore.currentPage + 3)"
        >
          +3
        </button>
      </nav>
    </section>

    <p v-if="reviewsStore.error" class="request-message request-message--error">
      {{ reviewsStore.error }}
    </p>

    <section
      v-else-if="
        organizationStore.organisation && !reviewsStore.loading && !reviewsStore.reviews.length
      "
      class="reviews-empty"
    >
      <h2>Отзывов нет</h2>
      <p>Для выбранной организации пока не найдено ни одного отзыва.</p>
    </section>
  </main>
</template>

<script setup lang="ts">
import Button from '@/components/Button/Button.vue'
import Input from '@/components/Input/Input.vue'
import Review from '@/components/Review/Review.vue'
import Stat from '@/components/Stat/Stat.vue'
import Loader from '@/components/Loader/Loader.vue'

import { computed, onMounted, ref } from 'vue'

import { AuthStore } from '@/stores/Auth'
import { storeOrganization } from '@/stores/Organization'
import { storeReviews } from '@/stores/Reviews'

import { useRouter } from 'vue-router'

const authStore = AuthStore()
const organizationStore = storeOrganization()
const reviewsStore = storeReviews()

const router = useRouter()

const url = ref<string>('')
const urlError = ref<string>('')
const selectedOrganizationId = ref<number | ''>('')

const isFirstPage = computed(() => reviewsStore.currentPage === 1)
const isLastPage = computed(() => reviewsStore.currentPage === reviewsStore.lastPage)

const visiblePages = computed(() => {
  const firstPage = Math.max(1, reviewsStore.currentPage - 1)
  const lastPage = Math.min(reviewsStore.lastPage, reviewsStore.currentPage + 1)

  return Array.from({ length: lastPage - firstPage + 1 }, (_, index) => firstPage + index)
})

const styleMessage = computed(() => {
  if (organizationStore.error && !organizationStore.notification) {
    return 'request-message request-message--error'
  }

  return 'request-message request-message--accomplishment'
})

const notificationMessage = computed(() => {
  if (organizationStore.error && !organizationStore.notification) {
    return organizationStore.error
  }

  return organizationStore.notification
})

const validateYandexUrl = (value: string): string => {
  if (!value.trim()) {
    return 'Введите ссылку на организацию'
  }

  try {
    const parsedUrl = new URL(value)
    const allowedHosts = ['yandex.ru', 'www.yandex.ru']

    if (!allowedHosts.includes(parsedUrl.hostname) || !parsedUrl.pathname.startsWith('/maps/')) {
      return 'Введите ссылку на организацию в Яндекс Картах'
    }
  } catch {
    return 'Введите корректную ссылку'
  }

  return ''
}

const heandlerInput = () => {
  urlError.value = validateYandexUrl(url.value)
}

const handleOrganizationSelect = async () => {
  const organizationId = Number(selectedOrganizationId.value)
  let organization = null

  for (const item of organizationStore.allOrganisations) {
    if (item.id === organizationId) {
      organization = item
      break
    }
  }

  if (!organization) {
    organizationStore.organisation = null
    reviewsStore.reviews = []
    return
  }

  organizationStore.organisation = organization
  url.value = organization.yandex_url

  await reviewsStore.getReviews(organization.id, 1, reviewsStore.reviewsPerPage)
}

const changePage = async (page: number) => {
  if (!organizationStore.organisation) {
    return
  }

  const targetPage = Math.min(reviewsStore.lastPage, Math.max(1, page))

  if (targetPage === reviewsStore.currentPage) {
    return
  }

  await reviewsStore.getReviews(
    organizationStore.organisation.id,
    targetPage,
    reviewsStore.reviewsPerPage,
  )
}

const handleReviewsPerPageChange = async () => {
  if (!organizationStore.organisation) {
    return
  }

  await reviewsStore.getReviews(organizationStore.organisation.id, 1, reviewsStore.reviewsPerPage)
}

const undoBtn = async () => {
  if (!organizationStore.organisation || isFirstPage.value) {
    return
  }

  await changePage(reviewsStore.currentPage - 1)
}

const nextBtn = async () => {
  if (!organizationStore.organisation || isLastPage.value) {
    return
  }

  await changePage(reviewsStore.currentPage + 1)
}

const submitUrl = async (): Promise<boolean> => {
  urlError.value = validateYandexUrl(url.value)

  if (urlError.value) {
    return false
  }

  const isCreated = await organizationStore.createOrganization(url.value)

  if (isCreated && organizationStore.organisation) {
    selectedOrganizationId.value = organizationStore.organisation.id
    url.value = ''
    reviewsStore.reviews = []

    organizationStore.startPollingOrganization(
      organizationStore.organisation.id,
      async (organization) => {
        organizationStore.organisation = organization

        await reviewsStore.getReviews(organization.id, 1, reviewsStore.reviewsPerPage)

        await organizationStore.getAllOrganisations()
      },
    )
  }

  return isCreated
}

const handleLogout = async () => {
  const isLoggedOut = await authStore.logout()

  if (isLoggedOut) {
    await router.push('/login')
  }
}

onMounted(async () => {
  await organizationStore.getAllOrganisations()
})
</script>

<style src="./Settings.css"></style>
