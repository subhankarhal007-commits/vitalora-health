export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: 'Nutrition' | 'Mental Wellness' | 'Fitness & Movement' | 'Sleep & Recovery' | 'Preventive Care' | 'Longevity';
  featuredImage: string;
  imageCaption?: string;
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  publishedAt: string;
  updatedAt?: string;
  readTime: string;
  status: 'published' | 'draft';
  content: string; // HTML or Markdown formatted string
  tags: string[];
  views: number;
}

export interface FooterPage {
  slug: 'about-us' | 'contact-us' | 'privacy-policy' | 'terms-and-conditions' | 'medical-disclaimer' | 'affiliate-disclosure';
  title: string;
  lastUpdated: string;
  content: string;
}

export interface SiteStats {
  totalArticles: number;
  publishedCount: number;
  draftCount: number;
  totalViews: number;
  categories: { [key: string]: number };
}
