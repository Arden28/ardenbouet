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
  tags: Array<'saas' | 'client' | 'open-source'>;
  tech?: string[];
  metric?: string;
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
};

export type JourneyItem = {
  id: string;
  kind: 'education' | 'cert';
  year: string;
  title: string;
  org?: string;
  url?: string;
  note?: string;
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
};

export type ProductMediaItem = {
  url: string;
  kind: 'image' | 'video';
  label: string;
  description?: string;
};

export type ShopProduct = {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  category: 'platform' | 'app' | 'document' | 'service';
  price: number;
  currency: string;
  priceLabel: string;
  status: 'draft' | 'published' | 'archived';
  features: string[];
  tags: string[];
  cover?: string;
  demoUrl?: string;
  buyUrl?: string;
  media?: ProductMediaItem[];
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

export type ContentBundle = {
  projects: Project[];
  experiences: Experience[];
  journey: JourneyItem[];
  notes: Note[];
  products: ShopProduct[];
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
