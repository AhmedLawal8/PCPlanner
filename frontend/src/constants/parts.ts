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

// ── Saved build types ─────────────────────────────────────────────────────────

export interface SavedBuildPart {
  id: number
  name: string
  price: number
}

export interface SavedBuild {
  id: number
  name: string
  total_price: number
  summary: string
  created_at: string
  parts: Record<string, SavedBuildPart>
}

export interface PatchBuildResponse extends SavedBuild {
  warnings: string[]
}

// ── Shared UI constants ───────────────────────────────────────────────────────

export const CATEGORY_ORDER = [
  'cpu', 'gpu', 'motherboard', 'ram', 'storage', 'psu', 'case', 'cooler',
]

export const CATEGORY_LABELS: Record<string, string> = {
  cpu: 'CPU',
  gpu: 'GPU',
  motherboard: 'Motherboard',
  ram: 'RAM',
  storage: 'Storage',
  psu: 'PSU',
  case: 'Case',
  cooler: 'Cooler',
}

export interface FieldConfig {
  key: string
  label: string
  format?: (val: unknown) => string
}

export const COMPONENT_FIELDS: Record<string, FieldConfig[]> = {
  cpu: [
    { key: 'price', label: 'Price', format: (v) => `$${Number(v).toFixed(2)}` },
    { key: 'cores', label: 'Cores' },
    { key: 'base_clock', label: 'Base Clock', format: (v) => `${v} GHz` },
    { key: 'boost_clock', label: 'Boost Clock', format: (v) => `${v} GHz` },
    { key: 'wattage', label: 'TDP', format: (v) => `${v}W` },
    { key: 'socket', label: 'Socket' },
  ],
  motherboard: [
    { key: 'price', label: 'Price', format: (v) => `$${Number(v).toFixed(2)}` },
    { key: 'socket', label: 'Socket' },
    { key: 'type', label: 'Type' },
    { key: 'memory_type', label: 'Memory Type' },
    { key: 'max_memory', label: 'Max Memory', format: (v) => `${v} GB` },
  ],
  gpu: [
    { key: 'price', label: 'Price', format: (v) => `$${Number(v).toFixed(2)}` },
    { key: 'vram', label: 'VRAM', format: (v) => `${v} GB` },
    { key: 'wattage', label: 'TDP', format: (v) => `${v}W` },
    { key: 'chipset', label: 'Chipset' },
  ],
  ram: [
    { key: 'price', label: 'Price', format: (v) => `$${Number(v).toFixed(2)}` },
    { key: 'capacity', label: 'Capacity', format: (v) => `${v} GB` },
    { key: 'speed', label: 'Speed', format: (v) => `${v} MHz` },
    { key: 'memory_type', label: 'Memory Type' },
  ],
  storage: [
    { key: 'price', label: 'Price', format: (v) => `$${Number(v).toFixed(2)}` },
    { key: 'capacity', label: 'Capacity', format: (v) => `${v} GB` },
    { key: 'drive_type', label: 'Drive Type' },
    { key: 'interface', label: 'Interface' },
  ],
  psu: [
    { key: 'price', label: 'Price', format: (v) => `$${Number(v).toFixed(2)}` },
    { key: 'wattage', label: 'Wattage', format: (v) => `${v}W` },
    { key: 'efficiency_rating', label: 'Efficiency' },
  ],
  case: [
    { key: 'price', label: 'Price', format: (v) => `$${Number(v).toFixed(2)}` },
    { key: 'case_type', label: 'Type' },
    { key: 'color', label: 'Color' },
  ],
  cooler: [
    { key: 'price', label: 'Price', format: (v) => `$${Number(v).toFixed(2)}` },
    { key: 'rpm', label: 'Fan Speed', format: (v) => `${v} RPM` },
    { key: 'noise_level', label: 'Noise', format: (v) => `${v} dB` },
    { key: 'radiator_size', label: 'Radiator', format: (v) => `${v} mm` },
  ],
}
