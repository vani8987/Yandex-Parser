export function getXsrfToken(): string {
  const cookie = document.cookie.split('; ').find((item) => item.startsWith('XSRF-TOKEN='))

  return cookie ? decodeURIComponent(cookie.split('=')[1] ?? '') : ''
}
