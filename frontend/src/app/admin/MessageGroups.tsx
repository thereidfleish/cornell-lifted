import React, { useEffect, useState } from "react";
import Table, { TableHeader } from "@/components/Table";
import { useGlobal } from "@/utils/GlobalContext";

const tableHeaders: TableHeader[] = [
    { key: "name", label: "Message Group Name" },
    { key: "hide", label: "Hide Cards" },
    { key: "actions", label: "Actions" },
    { key: "internal", label: "Internal Name" },
    { key: "delete", label: "Delete" },
];

export default function Essentials() {
    const { config, refreshConfig } = useGlobal() as any;
    const [pptxFiles, setPptxFiles] = useState<string[]>([]);
    const [uploading, setUploading] = useState<string | null>(null);
    const [adding, setAdding] = useState(false);
    const [error, setError] = useState("");
    const [statusMsg, setStatusMsg] = useState<string>("");

    // Remove latest year logic
    const [semester, setSemester] = useState<string>("sp");
    const [year, setYear] = useState<number>(2025);

    // Fetch pptx template files
    useEffect(() => {
        fetch("/api/admin/get-pptx-templates-files")
            .then(res => res.json())
            .then(data => setPptxFiles(data.pptx_templates_files || []));
    }, [config]);

    // Add new message group
    async function handleAddGroup(e: React.FormEvent) {
        e.preventDefault();
        setAdding(true);
        setError("");
        try {
            const res = await fetch("/api/admin/add-message-group", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ semester, year }),
            });
            const data = await res.json();
            setStatusMsg(data.status || "");
            if (!res.ok) throw new Error("Failed to add message group");
            setYear(2025);
            setSemester("sp");
            refreshConfig();
        } catch (err) {
            setError("Error adding message group");
        }
        setAdding(false);
    }

    // Hide cards toggle
    async function handleHideChange(group: string, checked: boolean) {
        const res = await fetch(`/api/admin/update-hidden-cards/${group}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ "hidden-cards": checked }),
        });
        const data = await res.json();
        setStatusMsg(data.status || "");
        refreshConfig();
    }

    // Delete message group
    async function handleDelete(group: string) {
        const res = await fetch(`/api/admin/remove-message-group/${group}`);
        const data = await res.json();
        setStatusMsg(data.status || "");
        refreshConfig();
    }

    // Upload PPTX
    async function handleUpload(group: string, file: File) {
        setUploading(group);
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`/api/admin/upload-pptx-template/${group}`, {
            method: "POST",
            body: formData,
        });
        const data = await res.json();
        setStatusMsg(data.status || "");
        setUploading(null);
        refreshConfig();
    }

    // Download PPTX
    function pptxDownloadLink(group: string) {
        return pptxFiles.includes(group)
            ? `/api/admin/get-pptx-template/${group}`
            : null;
    }

    // Table data
    const rows = Object.entries(config?.message_group_list_map || {}).map(([key, name]) => {
        // PDF test URLs
        const pdfShortUrl = `/api/get-card-pdf/12870?override-template=${key}`;
        const pdfLongUrl = `/api/get-card-pdf/16193?override-template=${key}`;
        return {
            name: String(name),
            hide: (
                <input
                    type="checkbox"
                    checked={config?.hidden_cards?.includes(key) || false}
                    onChange={e => handleHideChange(key, e.target.checked)}
                />
            ),
            actions: (
                <div className="flex flex-col gap-2 items-start">
                    {pptxDownloadLink(key) ? (
                        <a href={pptxDownloadLink(key) ?? undefined} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Download PPTX</a>
                    ) : <span>-</span>}
                    <a href={pdfShortUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Test PDF (Short Card)</a>
                    <a href={pdfLongUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Test PDF (Long Card)</a>
                    <label className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded cursor-pointer shadow border border-gray-300">
                        <span>Upload PPTX</span>
                        <input
                            type="file"
                            accept=".pptx"
                            disabled={uploading === key}
                            onChange={e => {
                                if (e.target.files?.[0]) handleUpload(key, e.target.files[0]);
                            }}
                            className="hidden"
                        />
                    </label>
                </div>
            ),
            internal: String(key),
            delete: (
                <button
                    className="text-red-600 text-xl"
                    title="Delete message group"
                    onClick={() => handleDelete(key)}
                >
                    🗑️
                </button>
            ),
        };
    });

    // Hide status message after 2 seconds
    useEffect(() => {
        if (statusMsg) {
            const timer = setTimeout(() => setStatusMsg(""), 2000);
            return () => clearTimeout(timer);
        }
    }, [statusMsg]);

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold">Message Groups</h2>
            <p>
                Add message groups for each semester. By default, both physical and eLifted groups are added. If only one is needed, you can delete the other after adding.
            </p>
            <form onSubmit={handleAddGroup} className="flex flex-col gap-2 max-w-md mb-4">
                <label className="font-semibold">Add physical and eLifted message groups</label>
                <div className="flex gap-4 items-center">
                    <label className="flex items-center gap-2">
                        <input
                            type="radio"
                            name="semester"
                            value="sp"
                            checked={semester === "sp"}
                            onChange={() => setSemester("sp")}
                        />
                        Spring
                    </label>
                    <label className="flex items-center gap-2">
                        <input
                            type="radio"
                            name="semester"
                            value="fa"
                            checked={semester === "fa"}
                            onChange={() => setSemester("fa")}
                        />
                        Fall
                    </label>
                    <label className="flex items-center gap-2">
                        Year
                        <input
                            type="number"
                            min={1000}
                            max={9999}
                            value={year}
                            onChange={e => setYear(Number(e.target.value))}
                            className="border rounded p-2 w-20"
                            required
                        />
                    </label>
                </div>
                <button
                    type="submit"
                    className="bg-cornell-blue text-white font-semibold px-4 py-2 rounded-lg shadow hover:bg-cornell-red transition"
                    disabled={adding}
                >
                    {adding ? "Adding..." : "Add Message Group"}
                </button>
                {error && <div className="text-red-600">{error}</div>}
            </form>
            <ul className="list-disc ml-6">
                <li>
                    <b>Hide Cards</b>: Prevent users from seeing cards on the website until Lifted Day.  Usually, only unhide the eLifted cards on Lifted Day.
                </li>
                <li>
                    <b>Upload PPTX Template</b>: Upload a card template in PPTX format with the proper placeholders (download a previous example to see them). You can make one in Google Slides and then download as PPTX. 
                    <ul className="list-disc ml-6">
                        <li>If you want a different card template for each attachment, put the default slide first (representing no attachment selected), then attachment-specific slides in the order they appear in the <b>Attachments</b> tab.</li>
                        <li>Set the AutoFit settings for the textbox to <a href="https://support.google.com/docs/answer/10364036?hl=en"><b>Shrink text on overflow</b></a>.</li>
                        <li>Test your template with example cards.</li>
                    </ul>
                </li>
                <li>
                    <b>Delete Message Group</b>: Only if you don't need both physical and eLifted. This deletes all cards in the group.
                </li>
            </ul>
            {statusMsg && (
                <div className="text-green-700 font-semibold mb-2">{statusMsg}</div>
            )}
            <Table headers={tableHeaders} data={rows} maxHeight={400} />
        </div>
    );
}
