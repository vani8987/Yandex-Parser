import type { Ref } from 'vue'

interface ErrorResponse {
  message?: string
}

async function getResponseError(response: Response): Promise<string> {
  const data = (await response.json().catch(() => null)) as ErrorResponse | null

  return data?.message ?? `Ошибка запроса: ${response.status}`
}

export async function fetchGet<T>(loading: Ref<boolean>, url: RequestInfo): Promise<T> {
  try {
    loading.value = true
    const response = await fetch(url, {
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'content-type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(await getResponseError(response))
    }

    return (await response.json()) as T
  } finally {
    loading.value = false
  }
}

export async function fetchPost<TBody = undefined, TResponse = void>(
  loading: Ref<boolean>,
  url: RequestInfo,
  data?: TBody,
  xsrfToken?: string,
): Promise<TResponse> {
  try {
    loading.value = true

    const options: RequestInit = {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(xsrfToken && {
          'X-XSRF-TOKEN': xsrfToken,
        }),
      },
    }

    if (data !== undefined) {
      options.body = JSON.stringify(data)
    }

    const response = await fetch(url, options)

    if (!response.ok) {
      throw new Error(await getResponseError(response))
    }

    return (await response.json()) as TResponse
  } finally {
    loading.value = false
  }
}
