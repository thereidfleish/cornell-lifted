import { Auth, User } from "@/types/User";
import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function useAuth() {
  const [auth, setAuth] = useState<Auth | null>(null);

  useEffect(() => {
    fetch(`/api/auth/status`, { credentials: "include" })
      .then(res => res.json())
      .then(data => setAuth(data))
      .catch(() => setAuth({ authenticated: false }));
  }, []);

  return auth;
}
