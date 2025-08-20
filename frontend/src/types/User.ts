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