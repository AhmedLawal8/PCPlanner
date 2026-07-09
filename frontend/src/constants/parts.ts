export interface PartOption {
  name: string
  price: number
}

export interface PartCategoryGroup {
  category: string
  options: PartOption[]
  recommendedIndex: number
}

export const MOCK_PART_GROUPS: PartCategoryGroup[] = [
  {
    category: 'CPU',
    recommendedIndex: 0,
    options: [
      { name: 'AMD Ryzen 7 7800X3D', price: 379.99 },
      { name: 'AMD Ryzen 5 7600X', price: 229.99 },
      { name: 'Intel Core i5-14600K', price: 289.99 },
      { name: 'Intel Core i7-14700K', price: 389.99 },
      { name: 'AMD Ryzen 9 7900X', price: 429.99 },
    ],
  },
  {
    category: 'Motherboard',
    recommendedIndex: 0,
    options: [
      { name: 'ASUS ROG Strix B650E-F', price: 249.99 },
      { name: 'MSI PRO B650-P WiFi', price: 159.99 },
      { name: 'Gigabyte B650 Aorus Elite AX', price: 189.99 },
      { name: 'ASRock B650M Pro RS', price: 129.99 },
      { name: 'ASUS TUF Gaming X670E-Plus', price: 299.99 },
    ],
  },
  {
    category: 'GPU',
    recommendedIndex: 0,
    options: [
      { name: 'NVIDIA GeForce RTX 4070 Super', price: 599.99 },
      { name: 'AMD Radeon RX 7800 XT', price: 499.99 },
      { name: 'NVIDIA GeForce RTX 4060 Ti', price: 399.99 },
      { name: 'NVIDIA GeForce RTX 4070 Ti Super', price: 799.99 },
      { name: 'AMD Radeon RX 7900 GRE', price: 549.99 },
    ],
  },
  {
    category: 'RAM',
    recommendedIndex: 0,
    options: [
      { name: 'Corsair Vengeance 32GB DDR5-6000', price: 109.99 },
      { name: 'G.Skill Trident Z5 32GB DDR5-6000', price: 119.99 },
      { name: 'Kingston Fury Beast 32GB DDR5-5600', price: 94.99 },
      { name: 'Corsair Vengeance 64GB DDR5-6000', price: 199.99 },
      { name: 'G.Skill Ripjaws S5 32GB DDR5-6400', price: 129.99 },
    ],
  },
  {
    category: 'Storage',
    recommendedIndex: 0,
    options: [
      { name: 'Samsung 990 Pro 2TB NVMe SSD', price: 149.99 },
      { name: 'WD Black SN850X 1TB NVMe SSD', price: 89.99 },
      { name: 'Crucial T500 2TB NVMe SSD', price: 129.99 },
      { name: 'Samsung 990 Pro 4TB NVMe SSD', price: 299.99 },
      { name: 'Seagate FireCuda 530 1TB NVMe SSD', price: 99.99 },
    ],
  },
  {
    category: 'PSU',
    recommendedIndex: 0,
    options: [
      { name: 'Corsair RM850x', price: 139.99 },
      { name: 'EVGA SuperNOVA 750 G6', price: 109.99 },
      { name: 'be quiet! Straight Power 12 850W', price: 159.99 },
      { name: 'Corsair RM1000x', price: 189.99 },
      { name: 'MSI MAG A750GL PCIE5', price: 99.99 },
    ],
  },
  {
    category: 'Case',
    recommendedIndex: 0,
    options: [
      { name: 'NZXT H5 Flow', price: 94.99 },
      { name: 'Fractal Design Pop Air', price: 89.99 },
      { name: 'Lian Li Lancool 216', price: 109.99 },
      { name: 'Corsair 4000D Airflow', price: 104.99 },
      { name: 'Phanteks P400A', price: 79.99 },
    ],
  },
]

export const MOCK_AI_OVERVIEW = 'Placeholder Summary.'
