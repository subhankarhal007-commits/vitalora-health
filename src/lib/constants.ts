export const HEALTH_CATEGORIES = [
  'All',
  'Nutrition',
  'Mental Wellness',
  'Fitness & Movement',
  'Sleep & Recovery',
  'Preventive Care',
  'Longevity',
] as const;

export const CURATED_HEALTH_IMAGES = [
  {
    title: 'Morning Sun & Mindful Meditation',
    url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80',
    caption: 'Morning sunlight exposure and conscious breathwork reset circadian rhythms.',
    category: 'Sleep & Recovery'
  },
  {
    title: 'Fresh Organic Whole Foods & Botanicals',
    url: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=80',
    caption: 'Vibrant phytonutrients and polyphenol-dense whole foods nourish the microbiome.',
    category: 'Nutrition'
  },
  {
    title: 'Outdoor Trail Running & Zone 2 Fitness',
    url: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=1200&q=80',
    caption: 'Sustained aerobic movement strengthens cardiac output and cellular mitochondria.',
    category: 'Fitness & Movement'
  },
  {
    title: 'Clinical Laboratory & Preventive Testing',
    url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80',
    caption: 'Targeted biomarker diagnostics enable proactive early health intervention.',
    category: 'Preventive Care'
  },
  {
    title: 'Yoga, Spinal Alignment & Vitality',
    url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1200&q=80',
    caption: 'Fascial mobility and mindful movement reduce systemic musculoskeletal tension.',
    category: 'Mental Wellness'
  },
  {
    title: 'Herbal Infusions & Functional Teas',
    url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=1200&q=80',
    caption: 'Medicinal herbal infusions provide calming bioflavonoids and adaptogens.',
    category: 'Nutrition'
  },
  {
    title: 'Deep Restorative Sleep & Nighttime Ecology',
    url: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=1200&q=80',
    caption: 'A cool, dark sleep sanctuary triggers nocturnal glymphatic waste clearance.',
    category: 'Sleep & Recovery'
  },
  {
    title: 'Nature Bathing (Shinrin-yoku) & Greenery',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80',
    caption: 'Phytoncides emitted by evergreen trees downregulate sympathetic cortisol arousal.',
    category: 'Mental Wellness'
  }
];

export const AUTHOR_PRESETS = [
  {
    name: 'Vitalora Health',
    role: 'Editorial Team',
    avatar: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=200&q=80'
  }
];
