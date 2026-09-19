import type { Tables } from "@shared/types"

export type ClientMessage = Omit<Tables<"messages">, 'media_urls'> & {
  is_uploading?: boolean
  is_error?: boolean
  media?: {
    url: string
    size: number
    type: string
  }[]
}
