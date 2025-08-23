import React, { useState, useEffect } from "react";
import MessageGroupSelector from "@/components/MessageGroupSelector";
import Table from "@/components/Table";
import { useGlobal } from "@/utils/GlobalContext";

export default function AttachmentOptions() {
    const { config, refreshConfig } = useGlobal() as any;
    // Current Message Group (updates config)
    const [selectedGroup, setSelectedGroup] = useState<string>(config?.attachment_message_group || "none");
    // Attachments table filter
    const [attachmentsFilterGroup, setAttachmentsFilterGroup] = useState<string>(config?.attachment_message_group || "none");
    const [attachments, setAttachments] = useState<any[]>([]);
    const [attachmentName, setAttachmentName] = useState("");
    const [attachmentCount, setAttachmentCount] = useState("");
    const [statusMsg, setStatusMsg] = useState("");
    const [loading, setLoading] = useState(false);

    // Attachment Prefs table filter
    const [prefsFilterGroup, setPrefsFilterGroup] = useState<string>(config?.attachment_message_group || "none");
    const [attachmentPrefs, setAttachmentPrefs] = useState<any[]>([]);
    const [prefsLoading, setPrefsLoading] = useState(false);
    const [prefsStatusMsg, setPrefsStatusMsg] = useState("");

    // Fetch attachment prefs for selected prefsFilterGroup
    useEffect(() => {
        async function fetchAttachmentPrefs() {
            setPrefsLoading(true);
            const res = await fetch(`/api/admin/get-attachment-prefs/${prefsFilterGroup}`);
            const data = await res.json();
            setAttachmentPrefs(data.attachment_prefs || []);
            setPrefsLoading(false);
        }
        fetchAttachmentPrefs();
    }, [prefsFilterGroup, prefsStatusMsg, config]);

    // Fetch attachments for selected attachmentsFilterGroup
    useEffect(() => {
        async function fetchAttachments() {
            setLoading(true);
            const res = await fetch(`/api/admin/get-attachments/${attachmentsFilterGroup}`);
            const data = await res.json();
            setAttachments(data.attachments || []);
            setLoading(false);
        }
        fetchAttachments();
    }, [attachmentsFilterGroup, statusMsg, config]);

    async function handleGroupChange(option: { key: string; label: string }) {
        setSelectedGroup(option.key);
        const formData = new FormData();
        formData.append("attachment-message-group", option.key);
        await fetch("/api/admin/update-attachment-message-group", {
            method: "POST",
            body: formData,
        });
        setStatusMsg("Attachment message group updated!");
        refreshConfig();
    }

    function handleAttachmentsFilterGroupChange(option: { key: string; label: string }) {
        setAttachmentsFilterGroup(option.key);
    }

    function handlePrefsFilterGroupChange(option: { key: string; label: string }) {
        setPrefsFilterGroup(option.key);
    }

    async function handleAddAttachment(e: React.FormEvent) {
        e.preventDefault();
        if (!attachmentName || !attachmentCount || attachmentsFilterGroup === "none") return;
        const formData = new FormData();
        formData.append("attachment-name", attachmentName);
        formData.append("attachment-count", attachmentCount);
        await fetch(`/api/admin/add-attachment/${attachmentsFilterGroup}`, {
            method: "POST",
            body: formData,
        });
        setAttachmentName("");
        setAttachmentCount("");
        setStatusMsg("Attachment added!");
        refreshConfig();
    }

    async function handleDeleteAttachment(id: string) {
        await fetch(`/api/admin/delete-attachment/${id}`, { method: "GET" });
        setStatusMsg("Attachment deleted!");
        refreshConfig();
    }

    async function handleDeleteAttachmentPref(id: string) {
        setPrefsLoading(true);
        const res = await fetch(`/api/delete-attachment-pref/${id}`, { method: "GET" });
        if (res.ok) {
            setPrefsStatusMsg("Attachment pref deleted!");
            refreshConfig();
        } else {
            setPrefsStatusMsg("Failed to delete attachment pref.");
        }
        setPrefsLoading(false);
    }

    useEffect(() => {
        if (prefsStatusMsg) {
            const timer = setTimeout(() => setPrefsStatusMsg(""), 2000);
            return () => clearTimeout(timer);
        }
    }, [prefsStatusMsg]);

    useEffect(() => {
        if (statusMsg) {
            const timer = setTimeout(() => setStatusMsg(""), 2000);
            return () => clearTimeout(timer);
        }
    }, [statusMsg]);

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold">Attachment Options</h2>
            <p>Add, remove, and edit attachments for the selected message group.</p>
            <p><b>Current Message Group:</b> Set this to the message group that people will pick an attachment for. Set this to <b>None</b> to not allow any choosing attachments.</p>
            <div>
                <b>Current Message Group:</b>
                <MessageGroupSelector
                    initialValue={selectedGroup}
                    showNoneOption={true}
                    onChange={handleGroupChange}
                    className="max-w-md mt-2"
                />
            </div>


            <p className="mt-4 mb-1"><b>Add Attachments and Counts:</b> This will add for the message group selected in the filter below.</p>
            <div>
                <MessageGroupSelector
                    initialValue={attachmentsFilterGroup}
                    showNoneOption={false}
                    onChange={handleAttachmentsFilterGroupChange}
                    className="max-w-md mt-2"
                    dropdown={true}
                />
            </div>
            {statusMsg && <div className="text-green-700 font-semibold mb-2">{statusMsg}</div>}
            <div className="mt-4">
                <form className="flex flex-col gap-3 items-start mb-6" onSubmit={handleAddAttachment}>
                    <div className="flex flex-row gap-4 items-end">
                        <div className="flex flex-col">
                            <label htmlFor="attachment-name" className="font-medium text-gray-700">Attachment Name</label>
                            <input
                                id="attachment-name"
                                type="text"
                                placeholder="Attachment Name"
                                value={attachmentName}
                                onChange={e => setAttachmentName(e.target.value)}
                                className="border rounded px-3 py-2 w-64"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label htmlFor="attachment-count" className="font-medium text-gray-700">Count</label>
                            <input
                                id="attachment-count"
                                type="number"
                                placeholder="Count"
                                min={0}
                                value={attachmentCount}
                                onChange={e => setAttachmentCount(e.target.value)}
                                className="border rounded px-3 py-2 w-32"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="bg-cornell-blue text-white rounded px-4 py-2 font-semibold shadow hover:bg-cornell-red transition w-64 mt-2"
                        disabled={attachmentsFilterGroup === "none" || !attachmentName || !attachmentCount}
                    >
                        {loading ? "Adding..." : "Add Attachment"}
                    </button>
                </form>
                <Table
                    headers={[
                        { key: "attachment", label: "Attachment Name" },
                        { key: "count", label: "Count" },
                        { key: "actions", label: "Actions" },
                    ]}
                    data={attachments.map(a => ({
                        attachment: a.attachment,
                        count: a.count,
                        actions: (
                            <button
                                className="px-2 py-1 rounded bg-red-100 text-red-700 font-semibold border border-red-300 hover:bg-red-200"
                                onClick={() => handleDeleteAttachment(a.id)}
                            >
                                Delete
                            </button>
                        ),
                    }))}
                    maxHeight={600}
                    className="mt-2"
                />
            </div>

            <div className="mt-10">
                <h3 className="text-lg font-bold mb-2">Attachment Prefs Table</h3>
                <p className="mb-2 text-gray-700">The attachment_prefs table. Num entries: {attachmentPrefs.length}. Deleting will remove the pref and automatically increase the count of the attachment.</p>
                <div>
                    <b>Filter Attachment Prefs Table by Message Group:</b>
                    <MessageGroupSelector
                        initialValue={prefsFilterGroup}
                        showNoneOption={false}
                        onChange={handlePrefsFilterGroupChange}
                        className="max-w-md mt-2"
                        dropdown={true}
                    />
                </div>
                {prefsStatusMsg && <div className="text-green-700 font-semibold mb-2">{prefsStatusMsg}</div>}
                {prefsLoading ? (
                    <div className="text-gray-500">Loading attachment prefs...</div>
                ) : (
                    <Table
                        headers={[
                            { key: "id", label: "ID" },
                            { key: "recipient_email", label: "Recipient Email" },
                            { key: "message_group", label: "Message Group" },
                            { key: "attachment", label: "Attachment Name" },
                            { key: "delete", label: "Delete" },
                        ]}
                        data={attachmentPrefs.map(pref => ({
                            id: pref.id,
                            recipient_email: pref.recipient_email,
                            message_group: pref.message_group,
                            attachment: pref.attachment,
                            delete: (
                                <button
                                    title="Delete attachment pref"
                                    className="text-red-600 hover:text-red-800 text-lg px-2"
                                    onClick={() => handleDeleteAttachmentPref(pref.id)}
                                >
                                    🗑️
                                </button>
                            ),
                        }))}
                        maxHeight={400}
                        className="mt-2"
                    />
                )}
            </div>
        </div>
    );
}
