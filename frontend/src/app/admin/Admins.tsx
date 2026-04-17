import React, { useEffect, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { themeQuartz, ColDef } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import DeleteConfirmation from "@/components/DeleteConfirmation";
import PeopleSearch, { Person } from "@/components/PeopleSearch";
import useAdminReadOnly from "./useAdminReadOnly";

ModuleRegistry.registerModules([AllCommunityModule]);

interface Admin {
  email: string;
  admin_write_perm: boolean;
}

export default function AdminsSection() {
  const isReadOnlyAdmin = useAdminReadOnly();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [writePerm, setWritePerm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dataUpdated, setDataUpdated] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch admins
  useEffect(() => {
    fetchAdmins();
  }, []);

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

  const handleSelectPerson = (person: Person) => {
    setSelectedPerson(person);
  };

  // Add admin
  async function handleAddAdmin(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPerson) return;
    
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("admin_netid", selectedPerson.NetID.toLowerCase());
      if (writePerm) formData.append("admin_write_perm", "on");
      const res = await fetch("/api/admin/add-admin", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        setSelectedPerson(null);
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
  function openDeleteDialog(email: string) {
    setAdminToDelete(email);
    setConfirmOpen(true);
  }

  async function handleRemoveAdminConfirmed() {
    if (!adminToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/remove-admin/${encodeURIComponent(adminToDelete)}`, {
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

  async function handleWriteAccessChange(email: string, nextWritePerm: boolean) {
    setError(null);
    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("admin_write_perm", String(nextWritePerm));
      const res = await fetch("/api/admin/update-admin-write-access", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        setError("Failed to update write access");
        return;
      }

      const data = await res.json();
      setAdmins(data.admins || []);
      setDataUpdated(true);
      setTimeout(() => setDataUpdated(false), 2000);
    } catch (err) {
      setError("Failed to update write access");
    }
  }

  // AG Grid column definitions
  const columnDefs: ColDef<Admin>[] = [
    {
      headerName: "Email",
      field: "email",
    },
    {
      headerName: "Write Access",
      field: "admin_write_perm",
      cellRenderer: (params: any) => {
        const row = params.data as Admin;
        return (
          <select
            className="border rounded px-2 py-1 bg-white"
            value={row.admin_write_perm ? "true" : "false"}
            onChange={(e) => handleWriteAccessChange(row.email, e.target.value === "true")}
            disabled={isReadOnlyAdmin}
          >
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
        );
      },
    },
    {
      headerName: "Delete",
      cellRenderer: (params: any) => (
        <button
          title="Remove admin"
          className="text-red-600 hover:text-red-800 text-lg cursor-pointer"
          onClick={() => openDeleteDialog(params.data.email)}
          disabled={isReadOnlyAdmin}
        >
          🗑️
        </button>
      ),
    },
  ];

  return (
    <section className="mb-8">
      <h5 className="font-bold text-lg mb-2">Admins</h5>
      <p className="mb-4 text-gray-700">Add and remove admins. Admins have access to the Admin Dashboard, and can view, edit, and delete any and all Lifted messages. In other words, you have a lot of power - admins should only be trusted CP members!</p>
      
      {/* Add Admin Form */}
      <form className="mb-6 space-y-4" onSubmit={handleAddAdmin}>
        <div>
          <PeopleSearch onSelect={handleSelectPerson} selectedPerson={selectedPerson} />
        </div>

        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={writePerm}
              onChange={e => setWritePerm(e.target.checked)}
              disabled={isReadOnlyAdmin}
            />
            <span className="text-gray-700">Write Permission</span>
          </label>
          <p className="text-sm text-gray-500 mt-1">
            Unchecked = Read-only access (view only). Checked = Write access (can modify data).
          </p>
        </div>
        
        <button
          type="submit"
          className="bg-cornell-blue text-white rounded px-4 py-2 font-semibold shadow hover:bg-cornell-red transition"
          disabled={isReadOnlyAdmin || submitting || !selectedPerson}
        >
          {submitting ? "Adding..." : "Add Admin"}
        </button>
      </form>

      {dataUpdated && <div className="text-green-600 mb-2 font-semibold">✓ Admin list updated</div>}
      {error && <div className="text-red-600 mb-4 font-semibold">✗ {error}</div>}

      {/* Admins Table */}
      {loading ? (
        <div className="text-gray-500">Loading admins...</div>
      ) : (
        <>
          <div className="ag-theme-quartz" style={{ height: "400px", width: "100%" }}>
            <AgGridReact
              rowData={admins}
              columnDefs={columnDefs}
              theme={themeQuartz}
              suppressCellFocus={true}
            />
          </div>
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
