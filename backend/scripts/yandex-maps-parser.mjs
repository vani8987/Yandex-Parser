import { chromium } from 'playwright'

const url = process.argv[2]

if (!url) {
  throw new Error('Yandex Maps URL is required')
}

let parsedUrl

try {
  parsedUrl = new URL(url)
} catch {
  throw new Error(`Invalid URL provided: ${url}`)
}

const reviewsUrl = parsedUrl.href.includes('/reviews')
  ? parsedUrl.href
  : `${parsedUrl.href.replace(/\/$/, '')}/reviews/`

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const inProduction = process.env.PLAYWRIGHT_SERVER_MODE === 'true'

const args = inProduction ? 
    [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-extensions',
      '--disable-background-networking',
      '--disable-default-apps',
      '--disable-sync',
      '--disable-translate',
      '--disable-features=site-per-process',
      '--no-zygote',
      '--single-process',
      '--js-flags=--max-old-space-size=256',
    ] : [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
    ]

const browser = await chromium.launch({
  headless: true,
  chromiumSandbox: false,
  args
})

try {
  const page = await browser.newPage({
    locale: 'ru-RU',
    viewport: {
      width: 400,
      height: 300,
    },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
      + '(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    extraHTTPHeaders: {
      'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
    },
  })

  let navigationError

  page.setDefaultTimeout(30000)
  page.setDefaultNavigationTimeout(30000)

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await page.goto(reviewsUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      })
      navigationError = undefined
      break
    } catch (error) {
      navigationError = error
      await delay(1000)
    }
  }

  if (navigationError) {
    throw navigationError
  }

  try {
    await page.waitForSelector('[itemprop="reviewBody"], .business-reviews-card-view__review', {
      timeout: 30000,
    })
  } catch {
    const title = await page.title().catch(() => '')
    const preview = await page.locator('body').innerText({ timeout: 1000 }).catch(() => '')

    await page.screenshot({
      path: '/var/www/Yandex-Parser/backend/storage/app/yandex-debug.png',
      fullPage: true,
    }).catch(() => {})

    await page.content()
      .then((html) => {
        return import('node:fs/promises').then((fs) =>
          fs.writeFile('/var/www/Yandex-Parser/backend/storage/app/yandex-debug.html', html)
        )
      })
      .catch(() => {})

    throw new Error(JSON.stringify({
      message: 'Карточка организации не загрузилась',
      url: page.url(),
      title,
      preview: preview.slice(0, 500),
    }))
  }

  const reviewSelector = '[role="listitem"].business-reviews-card-view__review'
  let previousCount = 0
  let stableAttempts = 0

  for (let attempt = 0; attempt < 40 && stableAttempts < 3; attempt += 1) {
    const reviews = page.locator(reviewSelector)
    const count = await reviews.count()

    if (count === previousCount) {
      stableAttempts += 1
    } else {
      previousCount = count
      stableAttempts = 0
    }

    if (count > 0) {
      await page.evaluate((selector) => {
        const elements = document.querySelectorAll(selector)
        elements[elements.length - 1]?.scrollIntoView({ block: 'end' })
      }, reviewSelector)
    }

    await page.evaluate(() => {
      const scrollable = Array.from(document.querySelectorAll('*'))
        .find((el) => {
          const style = window.getComputedStyle(el)
          return el.scrollHeight > el.clientHeight && ['auto', 'scroll'].includes(style.overflowY)
        })

      scrollable?.scrollBy(0, 3000)
    })

    await page.mouse.wheel(0, 2500)
    await page.waitForTimeout(250)
  }

  await page.evaluate(() => {
    document
      .querySelectorAll('.business-review-view__expand[aria-label="Ещё"]')
      .forEach(el => el.click())
  })

  await delay(500)

  const data = await page.evaluate((selector) => {
    const text = (element) => element?.textContent?.trim() ?? ''
    const number = (value) => Number.parseInt(value.replace(/[^\d]/g, ''), 10) || 0
    const attribute = (selector, name) => document.querySelector(selector)?.getAttribute(name) ?? ''
    const ratingValue = attribute('[itemprop="aggregateRating"] [itemprop="ratingValue"]', 'content')
      || text(document.querySelector('.business-rating-badge-view__rating-text'))
      || text(document.querySelector('.business-summary-rating-badge__rating'))
    const ratingsCountValue = attribute('[itemprop="aggregateRating"] [itemprop="ratingCount"]', 'content')
      || text(document.querySelector('.business-header-rating-view__text'))
      || text(document.querySelector('.business-summary-rating-badge__rating-count'))
    const reviewsCountLabel =
      document.querySelector('.tabs-select-view__title_name_reviews')
        ?.getAttribute('aria-label') ?? ''


    const reviews = Array.from(document.querySelectorAll(selector)).map((review) => {
      const ratingLabel = review
        .querySelector('[aria-label*="Оценка"]')
        ?.getAttribute('aria-label') ?? ''

      return {
        author: text(review.querySelector('[itemprop="author"] [itemprop="name"]')),
        text: text(review.querySelector('[itemprop="reviewBody"]')),
        rating: Number.parseInt(ratingLabel.match(/\d+/)?.[0] ?? '0', 10),
        review_date: text(review.querySelector('.business-review-view__date')),
      }
    })

    const reviewsCount = Number.parseInt(
      reviewsCountLabel.match(/\d+/)?.[0] ?? `${reviews.length}`,
      10,
    )

    return {
      name: text(document.querySelector('.card-title-view__title-link, h1')),
      rating: Number.parseFloat(ratingValue.replace(',', '.')) || 0,
      ratings_count: number(ratingsCountValue),
      reviews_count: reviewsCount,
      reviews,
    }
  }, reviewSelector)


  process.stdout.write(JSON.stringify(data))
} finally {
  await browser.close()
}
