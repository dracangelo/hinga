export const IMG = (id, w = 900) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export const PEX = (id, w = 900) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;

/**
 * Storefront categories. `links` power the "directory" style category strip on
 * the home page — each one is a real, working shop filter.
 */
export const CATEGORIES = [
  {
    name: 'Flowering plants',
    slug: 'flowering-plants',
    image: PEX(37397030, 900),
    blurb: 'In bloom now — hydrangeas, kalanchoe and roses.',
    links: [
      { label: 'Hydrangeas', to: '/shop?category=flowering-plants&q=hydrangea' },
      { label: 'Kalanchoe', to: '/shop?category=flowering-plants&q=kalanchoe' },
      { label: 'Roses', to: '/shop?category=flowering-plants&q=rose' },
      { label: 'Best sellers', to: '/shop?category=flowering-plants&sort=popular' },
    ],
  },
  {
    name: 'Foliage plants',
    slug: 'foliage-plants',
    image: PEX(32293880, 900),
    blurb: 'Statement leaves and easy greenery for every room.',
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
    image: IMG('1485955900006-10f4d324d411', 900),
    blurb: 'Sun-loving, drought-tolerant and hard to kill.',
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
    image: PEX(35531493, 900),
    blurb: 'Long-blooming moth orchids in hand-thrown pots.',
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
    image: PEX(2073001, 900),
    blurb: 'Kitchen herbs, citrus trees and mints.',
    links: [
      { label: 'Kitchen herbs', to: '/shop?category=herbs-edibles&q=herb' },
      { label: 'Lemon trees', to: '/shop?category=herbs-edibles&q=lemon' },
      { label: 'Mints', to: '/shop?category=herbs-edibles&q=mint' },
      { label: 'Best sellers', to: '/shop?category=herbs-edibles&sort=popular' },
    ],
  },
  {
    name: 'Pots & care',
    slug: 'pots-care',
    image: PEX(37397147, 900),
    blurb: 'Planters, potting kits and everything to keep them growing.',
    links: [
      { label: 'Terracotta pots', to: '/shop?category=pots-care&q=terracotta' },
      { label: 'Potting kits', to: '/shop?category=pots-care&q=kit' },
      { label: 'Plant care', to: '/shop?category=pots-care&q=care' },
      { label: 'Under KSh 3,000', to: '/shop?category=pots-care&max=3000' },
    ],
  },
];

export const COLLECTIONS = [
  {
    label: 'In bloom now',
    to: '/shop?category=flowering-plants',
    image: PEX(5362009, 1400),
  },
  {
    label: 'Monstera & big leaves',
    to: '/shop?category=foliage-plants&q=monstera',
    image: PEX(32293880, 800),
  },
  {
    label: 'Snake plants',
    to: '/shop?category=foliage-plants&q=snake',
    image: PEX(22863428, 800),
  },
  {
    label: 'Succulents & cacti',
    to: '/shop?category=succulents-cacti',
    image: PEX(13799658, 800),
  },
  {
    label: 'Easy-care picks',
    to: '/shop?category=foliage-plants&sort=popular',
    image: PEX(12014192, 800),
  },
  {
    label: 'Pots & potting kits',
    to: '/shop?category=pots-care',
    image: PEX(37397147, 1400),
  },
];

export const SHOP_LINKS = [
  { label: 'All plants & pots', to: '/shop' },
  { label: 'Best sellers', to: '/shop?sort=popular' },
  { label: 'New arrivals', to: '/shop?sort=newest' },
  { label: 'Top rated', to: '/shop?sort=rating' },
  { label: 'Under KSh 5,000', to: '/shop?max=5000' },
];

export const OCCASIONS = [
  { label: 'Housewarming', to: '/shop?occasion=housewarming' },
  { label: 'Birthday', to: '/shop?occasion=birthday' },
  { label: 'Get well', to: '/shop?occasion=get-well' },
  { label: 'Thank you', to: '/shop?occasion=thank-you' },
  { label: 'Anniversary', to: '/shop?occasion=anniversary' },
  { label: 'Sympathy', to: '/shop?occasion=sympathy' },
  { label: 'Wedding', to: '/shop?occasion=wedding' },
  { label: 'Friendship', to: '/shop?occasion=friendship' },
];
