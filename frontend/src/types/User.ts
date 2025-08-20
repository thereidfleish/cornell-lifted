export type User = {
  id: string;
  email: string;
  name: string;
  is_admin: boolean;
};

export type Auth = {
  authenticated: boolean;
  user?: User;
};

export type LiftedHomepageStats = {
  total_received: number;
  unique_sent: number;
  unique_received: number;
};