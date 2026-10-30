/** Shared vocabulary for the landscaping quotation flow. */

export const FLOWER_OPTIONS = [
  'Roses',
  'Hydrangeas',
  'Bougainvillea',
  'Jasmine',
  'Lavender',
  'Bird of paradise',
  'Orchids',
  'Kalanchoe',
  'Alyssum',
  'Indigenous shrubs',
];

export const SITE_TYPES = [
  { value: 'home-garden', label: 'Home garden' },
  { value: 'courtyard', label: 'Courtyard' },
  { value: 'rooftop', label: 'Rooftop terrace' },
  { value: 'office', label: 'Office & commercial' },
  { value: 'hospitality', label: 'Hotel & hospitality' },
  { value: 'school', label: 'School & community' },
];

export const TIMELINES = [
  { value: 'asap', label: 'As soon as possible' },
  { value: 'within-a-month', label: 'Within a month' },
  { value: 'one-to-three-months', label: 'In one to three months' },
  { value: 'planning', label: 'Just planning for now' },
];

export const BUDGETS = [
  { value: 'unsure', label: 'Not sure yet' },
  { value: 'under-50k', label: 'Under KSh 50,000' },
  { value: '50k-150k', label: 'KSh 50,000 – 150,000' },
  { value: '150k-400k', label: 'KSh 150,000 – 400,000' },
  { value: 'over-400k', label: 'Over KSh 400,000' },
];

export const REQUEST_STATUSES = ['new', 'contacted', 'quoted', 'won', 'lost'];

export const REQUEST_STATUS_META = {
  new: { label: 'New', className: 'bg-gold-soft text-gold' },
  contacted: { label: 'Contacted', className: 'bg-blush text-rose' },
  quoted: { label: 'Quoted', className: 'bg-sage-soft text-forest' },
  won: { label: 'Won', className: 'bg-forest text-white' },
  lost: { label: 'Lost', className: 'bg-parchment text-ink-faint' },
};

export const REQUEST_STATUS_NOTE = {
  new: 'With the garden team — we usually reply within two working days.',
  contacted: 'A landscaper is in touch to arrange the site visit and measurements.',
  quoted: 'Your written quotation is with you — reply to confirm and we book the planting.',
  won: 'Confirmed and booked. Planting, watering and aftercare follow from here.',
  lost: 'This request was closed — start a new one any time and we will pick it up.',
};

export const labelFor = (options, value) =>
  options.find((option) => option.value === value)?.label || value || '—';
