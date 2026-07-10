export type PartTier = 'budget' | 'best_value' | 'recommend' | 'performance'

export interface PartOption {
  id: number
  name: string
  price: number
  tier: PartTier
  why: string
}

export interface PartCategoryGroup {
  category: string
  options: PartOption[]
}

export interface GenerateResponse {
  parts: Record<string, PartOption[]>
  total_price: number
  summary: string
}
