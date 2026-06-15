export interface Review {
  id: number
  organization_id: number
  author: string
  text: string | null
  rating: number
  review_date: string
}
