export type PartTier = 'budget' | 'best_value' | 'recommend' | 'performance'

export interface PartOption {
  id: number
  name: string
  price: number
  tier: PartTier
  why: string
}

// The backend returns a flat PartOption[] per category (no wrapper, no
// recommendedIndex). This grouped shape is a frontend-only view model
// that SummaryPage derives from that wire format, so PartOptionGroup/
// PartOptionCard's existing "options + recommendedIndex" selection logic
// doesn't need to know about tiers at all.
export interface PartCategoryGroup {
  category: string
  options: PartOption[]
  recommendedIndex: number
}
