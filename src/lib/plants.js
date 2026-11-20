// Shared constants + helpers for everything that shows plant records.

export const ZONES = ['lowland', 'upland', 'coastal', 'mangrove', 'freshwater'];

export const CONSERVATION = [
  'Not Evaluated', 'Data Deficient', 'Least Concern', 'Near Threatened',
  'Vulnerable', 'Endangered', 'Critically Endangered', 'Extinct in the Wild', 'Extinct',
];

export const STATUS = {
  draft:     { label: 'Draft',                 className: 'draft' },
  pending:   { label: 'Awaiting verification', className: 'pending' },
  published: { label: 'Published',             className: 'published' },
};

// What each query asks Supabase for (plant_media gives us the photos)
export const CARD_FIELDS =
  'id, local_name, scientific_name, family, genus, ecological_zone, plant_media(url, media_type, created_at)';
export const SPECIMEN_FIELDS =
  'id, local_name, scientific_name, family, genus, ecological_zone, description, plant_media(url, media_type, created_at)';

export const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

export const displayName = (p) => p.local_name || p.scientific_name;

const byOldest = (a, b) => new Date(a.created_at) - new Date(b.created_at);

// The first photo uploaded is the "main" photo
export const photosOf = (plant) =>
  (plant?.plant_media ?? []).filter((m) => m.media_type === 'image').sort(byOldest);

export const linksOf = (plant) =>
  (plant?.plant_media ?? []).filter((m) => m.media_type === 'external_link').sort(byOldest);

export const isWebUrl = (u) => /^https?:\/\/\S+$/i.test(u ?? '');

export function timeAgo(iso) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  const units = [
    ['year', 31536000], ['month', 2592000], ['week', 604800],
    ['day', 86400], ['hour', 3600], ['minute', 60],
  ];
  for (const [name, size] of units) {
    const n = Math.floor(seconds / size);
    if (n >= 1) return `${n} ${name}${n > 1 ? 's' : ''} ago`;
  }
  return 'just now';
}

export const monthYear = (dateStr) =>
  dateStr
    ? new Date(dateStr).toLocaleDateString('en', { month: 'short', year: 'numeric', timeZone: 'UTC' })
    : '';
