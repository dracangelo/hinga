const IMG = (id, w = 900) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

const PEX = (id, w = 900) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;

/**
 * Default storefront categories for the potted-plant studio. These are inserted
 * once when the categories table is first created, and mirror the storefront's
 * hard-coded fallback catalogue.
 */
export const DEFAULT_CATEGORIES = [
  {
    name: 'Flowering plants',
    slug: 'flowering-plants',
    description: 'In bloom now — hydrangeas, kalanchoe and cyclamen.',
    image: PEX(37397030, 900),
    links: [
      { label: 'Hydrangeas', to: '/shop?category=flowering-plants&q=hydrangea' },
      { label: 'Kalanchoe', to: '/shop?category=flowering-plants&q=kalanchoe' },
      { label: 'Cyclamen', to: '/shop?category=flowering-plants&q=cyclamen' },
      { label: 'Best sellers', to: '/shop?category=flowering-plants&sort=popular' },
    ],
  },
  {
    name: 'Foliage plants',
    slug: 'foliage-plants',
    description: 'Statement leaves and easy greenery for every room.',
    image: PEX(32293880, 900),
    links: [
      { label: 'Monstera', to: '/shop?category=foliage-plants&q=monstera' },
      { label: 'Fiddle leaf figs', to: '/shop?category=foliage-plants&q=fig' },
      { label: 'Snake plants', to: '/shop?category=foliage-plants&q=snake' },
      { label: 'Best sellers', to: '/shop?category=foliage-plants&sort=popular' },
    ],
  },
  {
    name: 'Succulents & cacti',
    slug: 'succulents-cacti',
    description: 'Sun-loving, drought-tolerant and hard to kill.',
    image: IMG('1485955900006-10f4d324d411', 900),
    links: [
      { label: 'String of pearls', to: '/shop?category=succulents-cacti&q=pearls' },
      { label: 'Echeveria', to: '/shop?category=succulents-cacti&q=echeveria' },
      { label: 'Cacti', to: '/shop?category=succulents-cacti&q=cactus' },
      { label: 'Under KSh 3,000', to: '/shop?category=succulents-cacti&max=3000' },
    ],
  },
  {
    name: 'Orchids',
    slug: 'orchids',
    description: 'Long-blooming moth orchids in hand-thrown pots.',
    image: PEX(35531493, 900),
    links: [
      { label: 'Moth orchids', to: '/shop?category=orchids&q=phalaenopsis' },
      { label: 'White orchids', to: '/shop?category=orchids&q=white' },
      { label: 'Under KSh 10,000', to: '/shop?category=orchids&max=10000' },
      { label: 'Best sellers', to: '/shop?category=orchids&sort=popular' },
    ],
  },
  {
    name: 'Herbs & edibles',
    slug: 'herbs-edibles',
    description: 'Kitchen herbs, citrus trees and bay topiary.',
    image: PEX(2073001, 900),
    links: [
      { label: 'Kitchen herbs', to: '/shop?category=herbs-edibles&q=herb' },
      { label: 'Lemon trees', to: '/shop?category=herbs-edibles&q=lemon' },
      { label: 'Topiary', to: '/shop?category=herbs-edibles&q=topiary' },
      { label: 'Best sellers', to: '/shop?category=herbs-edibles&sort=popular' },
    ],
  },
  {
    name: 'Pots & care',
    slug: 'pots-care',
    description: 'Planters, potting kits and everything to keep them growing.',
    image: PEX(37397147, 900),
    links: [
      { label: 'Terracotta pots', to: '/shop?category=pots-care&q=terracotta' },
      { label: 'Potting kits', to: '/shop?category=pots-care&q=kit' },
      { label: 'Plant care', to: '/shop?category=pots-care&q=care' },
      { label: 'Under KSh 3,000', to: '/shop?category=pots-care&max=3000' },
    ],
  },
];
