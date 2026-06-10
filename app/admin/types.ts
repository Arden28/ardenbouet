/* ===================== Types ===================== */
export type CaseImage = { src: string; alt: string };
export type CaseFile = {
  problem: string;
  approach: string[];
  result: string;
  images?: CaseImage[];
  tags?: string[];
  tech?: string[];
};
export type Project = {
  id: string;
  title: string;
  description: string;
  logoUrl: string;
  url: string;
  tags: Array<'saas' | 'client' | 'open-source' | 'mobile' | 'job'>;
  tech?: string[];
  metric?: string;
  language?: 'en' | 'fr' | 'both';
  caseFile?: CaseFile;
};

export type Experience = {
  id: string;
  title: string;
  job: string;
  fromTo: string;
  bullets: string[];
  type: 'Freelance' | 'Contract' | 'Full-time' | 'Part-time' | 'Intern';
  location?: 'On-site' | 'Hybrid' | 'Remote';
  logline?: string;
  outcomes?: string[];
  tags?: string[];
  poster?: string;
  language?: 'en' | 'fr' | 'both';
};

export type JourneyItem = {
  id: string;
  kind: 'education' | 'cert';
  year: string;
  title: string;
  org?: string;
  url?: string;
  note?: string;
  language?: 'en' | 'fr' | 'both';
};

export type Note = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  cover?: string;
  date: string;
  reading: string;
  tags: string[];
  bodyMd?: string;
  language?: 'en' | 'fr' | 'both';
};

export type ProductMediaItem = {
  url: string;
  kind: 'image' | 'video';
  label: string;
  description?: string;
};

export type DiscountCode = {
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  label?: string;
};

export type ShopProduct = {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  category: 'platform' | 'app' | 'document' | 'service';
  language?: 'en' | 'fr' | 'both';
  price: number;
  currency: string;
  priceLabel: string;
  status: 'draft' | 'published' | 'archived';
  features: string[];
  tags: string[];
  cover?: string;
  fileUrl?: string;
  demoUrl?: string;
  buyUrl?: string;
  media?: ProductMediaItem[];
  discountCodes?: DiscountCode[];
};

export type OrderStatus = 'PENDING' | 'PAID' | 'CANCELLED' | 'REFUNDED';

export type Order = {
  id: string;
  createdAt: string;
  updatedAt: string;
  customerName: string;
  customerEmail: string;
  productId: string;
  productTitle: string;
  status: OrderStatus;
  amount: number;
  currency: string;
  stripeId?: string | null;
  notes?: string | null;
};

export type SiteSettings = {
  // General
  siteTitle?: string;
  siteTagline?: string;
  contactEmail?: string;
  contactPhone?: string;
  location?: string;
  // Social
  github?: string;
  twitter?: string;
  linkedin?: string;
  instagram?: string;
  youtube?: string;
  // Storage (R2) — env vars take precedence over these
  r2AccountId?: string;
  r2AccessKeyId?: string;
  r2SecretAccessKey?: string;
  r2BucketName?: string;
  r2PublicUrl?: string;
};

export type ContentBundle = {
  projects: Project[];
  experiences: Experience[];
  journey: JourneyItem[];
  notes: Note[];
  products: ShopProduct[];
  settings?: SiteSettings;
};

export type Message = {
  id: string;
  date: string;
  fromName?: string;
  fromEmail?: string;
  subject: string;
  tags: string[];
  status: 'unread' | 'read' | 'archived';
  bodyMd: string;
};

export type * from './crm-types';
