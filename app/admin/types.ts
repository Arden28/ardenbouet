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
  title: string;                 // Company / Title
  job: string;                   // Role
  fromTo: string;                // "Apr 2023 ~ Oct 2023 · 7 months"
  bullets: string[];
  type: 'Freelance' | 'Contract' | 'Full-time' | 'Part-time' | 'Intern';
  location?: 'On-site' | 'Hybrid' | 'Remote'
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

/** NEW: Inbox-style content (replaces Notes tab) */
export type Message = {
  id: string;
  date: string;                 // ISO
  fromName?: string;
  fromEmail?: string;
  subject: string;
  tags: string[];               // e.g., ["lead","client","press"]
  status: 'unread' | 'read' | 'archived';
  bodyMd: string;               // markdown body
};

export type ContentBundle = {
  projects: Project[];
  experiences: Experience[];
  journey: JourneyItem[];
  notes: Note[]
  // messages: Message[];          // NEW
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
