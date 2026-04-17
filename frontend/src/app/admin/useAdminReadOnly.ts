import { useGlobal } from "@/utils/GlobalContext";

export default function useAdminReadOnly() {
  const { user } = useGlobal() as any;
  return Boolean(user?.user?.is_admin && !user?.user?.admin_write_perm);
}
