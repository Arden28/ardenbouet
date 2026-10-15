// lib/site.ts — owner identity + profile links used by the header, footer, home page and emails.
export const OWNER = {
  name: 'Arden BOUET',
  fullName: 'Arden Bouetoumoussa',
  avatar: '/images/me.png',
  location: 'Nairobi, Kenya',
  timezone: 'Africa/Nairobi',
  resume: '/files/cv-v6.pdf',
  supportEmail: 'laudbouetoumoussa@gmail.com',
} as const;

export const PROFILES = {
  github: 'https://github.com/arden28',
  linkedin: 'https://www.linkedin.com/in/arden-bouet/',
  upwork: 'https://www.upwork.com/freelancers/~01b718c179049bbd70',
} as const;
