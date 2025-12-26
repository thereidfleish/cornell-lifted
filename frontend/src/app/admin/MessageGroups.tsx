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
    const [googleSlidesIds, setGoogleSlidesIds] = useState<Record<string, string>>({});
    const [showModal, setShowModal] = useState<string | null>(null);
    const [slidesUrl, setSlidesUrl] = useState("");
    const [saving, setSaving] = useState(false);
    const [adding, setAdding] = useState(false);
    const [error, setError] = useState("");
    const [statusMsg, setStatusMsg] = useState<string>("");

    // Remove latest year logic
    const [semester, setSemester] = useState<string>("sp");
    const [year, setYear] = useState<number>(2025);

    // Fetch Google Slides IDs for all message groups
    useEffect(() => {
        const messageGroups = Object.keys(config?.message_group_list_map || {});
        Promise.all(
            messageGroups.map(group =>
                fetch(`/api/admin/get-google-slides-id/${group}`)
                    .then(res => res.json())
                    .then(data => ({ group, presentationId: data.presentation_id }))
            )
        ).then(results => {
            const ids: Record<string, string> = {};
            results.forEach(({ group, presentationId }) => {
                if (presentationId) ids[group] = presentationId;
            });
            setGoogleSlidesIds(ids);
        });
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

    // Open modal to set Google Slides link
    function openSlidesModal(group: string) {
        setShowModal(group);
        setSlidesUrl(googleSlidesIds[group] ? `https://docs.google.com/presentation/d/${googleSlidesIds[group]}/edit` : "");
    }

    // Save Google Slides ID
    async function handleSaveSlides(e: React.FormEvent) {
        e.preventDefault();
        if (!showModal) return;
        
        setSaving(true);
        const formData = new FormData();
        formData.append("url", slidesUrl);
        
        try {
            const res = await fetch(`/api/admin/save-google-slides-id/${showModal}`, {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            
            if (res.ok) {
                setStatusMsg("Google Slides template saved!");
                setGoogleSlidesIds(prev => ({ ...prev, [showModal]: data.presentation_id }));
                setShowModal(null);
                setSlidesUrl("");
            } else {
                setError(data.message || "Failed to save");
            }
        } catch (err) {
            setError("Error saving Google Slides link");
        }
        setSaving(false);
    }

    // Table data
    const rows = Object.entries(config?.message_group_list_map || {}).map(([key, name]) => {
        // PDF test URLs
        const pdfShortUrl = `/api/get-card-pdf/12870?override-template=${key}`;
        const pdfLongUrl = `/api/get-card-pdf/16193?override-template=${key}`;
        const hasSlides = !!googleSlidesIds[key];
        
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
                    {hasSlides ? (
                        <>
                            <a 
                                href={`https://docs.google.com/presentation/d/${googleSlidesIds[key]}/edit`} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-blue-600 underline"
                            >
                                View Google Slides
                            </a>
                            <a href={pdfShortUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Test PDF (Short Card)</a>
                            <a href={pdfLongUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Test PDF (Long Card)</a>
                        </>
                    ) : (
                        <span className="text-gray-500">No template set</span>
                    )}
                    <button
                        onClick={() => openSlidesModal(key)}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded shadow border border-gray-300"
                    >
                        {hasSlides ? "Update" : "Set"} Google Slides
                    </button>
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
                    <b>Hide Cards</b>: Prevent users from seeing cards on the website until Lifted Day. Usually, only unhide the eLifted cards on Lifted Day.
                </li>
                <li>
                    <b>Google Slides Template</b>: Set the Google Slides template for each message group. Create your template in Google Slides with these placeholders: <code>{'{{NET_ID}}'}</code>, <code>{'{{RECIPIENT_NAME}}'}</code>, <code>{'{{MESSAGE}}'}</code>, <code>{'{{SENDER_NAME}}'}</code>.
                    <ul className="list-disc ml-6">
                        <li>Make sure the template is in proper Lifted folder for the semester in the CP Shared Drive.</li>
                        <li><b>For multiple attachment templates:</b> Slide 1 should be the default (no attachment), and slides 2+ should be for each attachment in the exact order they appear in the Attachments tab (most recent first).</li>
                        <li>Test your template with example cards using the "Test PDF" links.</li>
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
            
            {/* Modal for Google Slides URL */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
                        <h3 className="text-xl font-bold mb-4">Set Google Slides Template</h3>
                        <form onSubmit={handleSaveSlides} className="space-y-4">
                            <div>
                                <label className="block font-semibold mb-2">
                                    Paste Google Slides URL or Presentation ID:
                                </label>
                                <input
                                    type="text"
                                    value={slidesUrl}
                                    onChange={e => setSlidesUrl(e.target.value)}
                                    placeholder="https://docs.google.com/presentation/d/..."
                                    className="w-full border rounded p-2"
                                    required
                                />
                                <p className="text-sm text-gray-600 mt-1">
                                    You can paste the full URL or just the presentation ID
                                </p>
                            </div>
                            {error && <div className="text-red-600">{error}</div>}
                            <div className="flex gap-2 justify-end">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(null);
                                        setSlidesUrl("");
                                        setError("");
                                    }}
                                    className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-4 py-2 rounded bg-cornell-blue text-white hover:bg-cornell-red disabled:opacity-50"
                                >
                                    {saving ? "Saving..." : "Save"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
