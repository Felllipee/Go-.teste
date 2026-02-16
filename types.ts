
export interface ShortLink {
  id: string;
  originalUrl: string;
  shortCode: string;
  alias?: string;
  createdAt: number;
  clicks: number;
  title: string;
  category: string; // e.g., "Séries Originais", "Documentários", "Ação"
  history: Array<{ date: string; clicks: number }>;
  posterUrl: string;
}

export enum AppState {
  PROFILES = 'PROFILES',
  HOME = 'HOME',
  DASHBOARD = 'DASHBOARD',
  CATALOG = 'CATALOG'
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
}
