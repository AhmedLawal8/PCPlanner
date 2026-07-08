export interface Part {
  category: string
  name: string
  price: number
}

export const MOCK_PARTS: Part[] = [
  { category: 'CPU', name: 'AMD Ryzen 7 7800X3D', price: 379.99 },
  { category: 'Motherboard', name: 'ASUS ROG Strix B650E-F', price: 249.99 },
  { category: 'GPU', name: 'NVIDIA GeForce RTX 4070 Super', price: 599.99 },
  { category: 'RAM', name: 'Corsair Vengeance 32GB DDR5-6000', price: 109.99 },
  { category: 'Storage', name: 'Samsung 990 Pro 2TB NVMe SSD', price: 149.99 },
  { category: 'PSU', name: 'Corsair RM850x', price: 139.99 },
  { category: 'Case', name: 'NZXT H5 Flow', price: 94.99 },
]

export const MOCK_AI_OVERVIEW =
  'Placeholder Summary.'
