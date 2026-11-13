import type { Commodity } from '../types/commodity.types';

export const COMMODITIES: Commodity[] = [
  {
    id: 'tomato',
    name: 'Tomato',
    category: 'vegetable',
    unit: '₹/quintal',
    slug: 'tomato',
    description: 'Fresh red tomatoes',
    varieties: [
      { id: 'tomato-hybrid', commodityId: 'tomato', name: 'Hybrid' },
      { id: 'tomato-local', commodityId: 'tomato', name: 'Local / Desi' },
      { id: 'tomato-vaishali', commodityId: 'tomato', name: 'Vaishali' },
    ]
  },
  {
    id: 'onion',
    name: 'Onion',
    category: 'vegetable',
    unit: '₹/quintal',
    slug: 'onion',
    description: 'Dry onion bulbs',
    varieties: [
      { id: 'onion-red', commodityId: 'onion', name: 'Nashik Red' },
      { id: 'onion-white', commodityId: 'onion', name: 'White' },
      { id: 'onion-garwa', commodityId: 'onion', name: 'Garwa' },
    ]
  },
  {
    id: 'potato',
    name: 'Potato',
    category: 'vegetable',
    unit: '₹/quintal',
    slug: 'potato',
    description: 'Fresh potato tubers',
    varieties: [
      { id: 'potato-jyoti', commodityId: 'potato', name: 'Kufri Jyoti' },
      { id: 'potato-chandramukhi', commodityId: 'potato', name: 'Chandramukhi' },
      { id: 'potato-chipsona', commodityId: 'potato', name: 'Chipsona' },
    ]
  },
  {
    id: 'wheat',
    name: 'Wheat',
    category: 'grain',
    unit: '₹/quintal',
    slug: 'wheat',
    description: 'Common wheat grain',
    varieties: [
      { id: 'wheat-sharbati', commodityId: 'wheat', name: 'Sharbati' },
      { id: 'wheat-lokwan', commodityId: 'wheat', name: 'Lokwan' },
      { id: 'wheat-hd2967', commodityId: 'wheat', name: 'HD-2967' },
    ]
  },
  {
    id: 'rice',
    name: 'Rice',
    category: 'grain',
    unit: '₹/quintal',
    slug: 'rice',
    description: 'Paddy and milled rice',
    varieties: [
      { id: 'rice-basmati', commodityId: 'rice', name: 'Basmati 1121' },
      { id: 'rice-sonamasuri', commodityId: 'rice', name: 'Sona Masuri' },
      { id: 'rice-ir64', commodityId: 'rice', name: 'IR-64' },
    ]
  },
  {
    id: 'chilli',
    name: 'Chilli',
    category: 'spice',
    unit: '₹/quintal',
    slug: 'chilli',
    description: 'Dry red chillies',
    varieties: [
      { id: 'chilli-guntur', commodityId: 'chilli', name: 'Guntur Sannam' },
      { id: 'chilli-teja', commodityId: 'chilli', name: 'Teja' },
      { id: 'chilli-byadgi', commodityId: 'chilli', name: 'Byadgi' },
    ]
  },
  {
    id: 'soybean',
    name: 'Soybean',
    category: 'oilseed',
    unit: '₹/quintal',
    slug: 'soybean',
    description: 'Yellow soybean grain',
    varieties: [
      { id: 'soybean-yellow', commodityId: 'soybean', name: 'Yellow' },
      { id: 'soybean-js335', commodityId: 'soybean', name: 'JS-335' },
    ]
  },
  {
    id: 'cotton',
    name: 'Cotton',
    category: 'fibre',
    unit: '₹/quintal',
    slug: 'cotton',
    description: 'Raw seed cotton / Kapas',
    varieties: [
      { id: 'cotton-medium', commodityId: 'cotton', name: 'Medium Staple' },
      { id: 'cotton-shankar6', commodityId: 'cotton', name: 'Shankar-6' },
    ]
  },
  {
    id: 'mustard',
    name: 'Mustard',
    category: 'oilseed',
    unit: '₹/quintal',
    slug: 'mustard',
    description: 'Rapeseed & mustard',
    varieties: [
      { id: 'mustard-black', commodityId: 'mustard', name: 'Black Mustard' },
      { id: 'mustard-pusabold', commodityId: 'mustard', name: 'Pusa Bold' },
    ]
  },
  {
    id: 'maize',
    name: 'Maize',
    category: 'grain',
    unit: '₹/quintal',
    slug: 'maize',
    description: 'Yellow dent corn',
    varieties: [
      { id: 'maize-yellow', commodityId: 'maize', name: 'Yellow Corn' },
      { id: 'maize-hybrid', commodityId: 'maize', name: 'Hybrid Corn' },
    ]
  },
];
