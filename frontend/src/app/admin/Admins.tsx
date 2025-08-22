import React, { useEffect, useState } from "react";
import DeleteConfirmation from "@/components/DeleteConfirmation";
import Table, { TableHeader } from "@/components/Table";

interface Admin {
  id: string;
  write: boolean;
}

const headers: TableHeader[] = [
  { key: "id", label: "NetID" },
  { key: "write", label: "Write Permission" },
  { key: "delete", label: "Delete" },
];

export default function AdminsSection() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [netid, setNetid] = useState("");
  const [writePerm, setWritePerm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dataUpdated, setDataUpdated] = useState(false);

  // Fetch admins
  useEffect(() => {
    async function fetchAdmins() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/get-admins");
        const data = await res.json();
        setAdmins(data.admins || []);
      } catch (err: any) {
        setError("Failed to load admins");
      }
      setLoading(false);
    }
    fetchAdmins();
  }, []);

  // Add admin
  async function handleAddAdmin(e: React.FormEvent) {
    e.preventDefault();
    if (!netid) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("admin_netid", netid);
      if (writePerm) formData.append("admin_write_perm", "on");
      const res = await fetch("/api/admin/add-admin", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        setNetid("");
        setWritePerm(false);
        const data = await res.json();
        setAdmins(data.admins || []);
        setDataUpdated(true);
        setTimeout(() => setDataUpdated(false), 2000);
      } else {
        setError("Failed to add admin");
      }
    } catch (err) {
      setError("Failed to add admin");
    }
    setSubmitting(false);
  }

  // Remove admin with confirmation dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  function openDeleteDialog(id: string) {
    setAdminToDelete(id);
    setConfirmOpen(true);
  }

  async function handleRemoveAdminConfirmed() {
    if (!adminToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/remove-admin/${adminToDelete}`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setAdmins(data.admins || []);
        setDataUpdated(true);
        setTimeout(() => setDataUpdated(false), 2000);
      } else {
        setError("Failed to remove admin");
      }
    } catch (err) {
      setError("Failed to remove admin");
    }
    setDeleting(false);
    setConfirmOpen(false);
    setAdminToDelete(null);
  }

  const tableData = admins.map((admin) => ({
    id: admin.id,
    write: admin.write ? "✅" : "❌",
    delete: (
      <button
        title="Remove admin"
        className="text-red-600 hover:text-red-800 text-lg px-2 cursor-pointer"
        onClick={() => openDeleteDialog(admin.id)}
      >
        🗑️
      </button>
    ),
  }));

  return (
    <section className="mb-8">
      <h5 className="font-bold text-lg mb-2">Admins</h5>
      <p className="mb-4 text-gray-700">Add and remove admins by NetID. Admins have access to the Admin Dashboard, and can view, edit, and delete any and all Lifted messages. In other words, you have a lot of power - admins should only be (trusted) CP members!</p>
      <form className="flex flex-col gap-4 items-start mb-6" onSubmit={handleAddAdmin}>
        <label htmlFor="netid" className="font-medium text-gray-700">NetID</label>
        <input
          id="netid"
          type="text"
          className="border rounded px-3 py-2"
          placeholder="NetID (e.g. rf377)"
          value={netid}
          onChange={e => setNetid(e.target.value)}
          required
        />
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={writePerm}
            onChange={e => setWritePerm(e.target.checked)}
          />
          Write Permission
        </label>
        <button
          type="submit"
          className="bg-cornell-blue text-white rounded px-4 py-2 font-semibold shadow hover:bg-cornell-red transition"
          disabled={submitting}
        >
          {submitting ? "Adding..." : "Add Admin"}
        </button>
      </form>
      {dataUpdated && <div className="text-green-600 mb-2">Data updated</div>}
      {error && <div className="text-red-600 mb-4">{error}</div>}
      {loading ? (
        <div className="text-gray-500">Loading admins...</div>
      ) : (
        <>
          <Table headers={headers} data={tableData} maxHeight={400} />
          <DeleteConfirmation
            open={confirmOpen}
            onConfirm={handleRemoveAdminConfirmed}
            onCancel={() => { setConfirmOpen(false); setAdminToDelete(null); }}
            deleting={deleting}
            title="Remove admin?"
            description="Are you sure you want to remove this admin? This action cannot be undone."
          />
        </>
      )}
    </section>
  );
}
