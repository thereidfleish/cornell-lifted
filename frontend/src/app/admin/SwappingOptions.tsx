import React, { useState, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
// Removed react-icons import, using emoji instead
import { useGlobal } from "@/utils/GlobalContext";
import MessageGroupSelector from "@/components/MessageGroupSelector";
import useAdminReadOnly from "./useAdminReadOnly";

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

interface SwapPref {
	id: number;
	recipient_email: string;
	message_group_from: string;
	message_group_to: string;
	event: string;
}

type SwapEntry = {
	from: string;
	to: string;
	enabled: boolean;
	text: string;
	title: string;
	button_text: string;
	deadline: string;
	dialog_text: string;
};

export default function SwappingOptions() {
	const { config } = useGlobal() as any;
	const isReadOnlyAdmin = useAdminReadOnly();
	const [swapPrefs, setSwapPrefs] = useState<SwapPref[]>([]);
	const [swapping, setSwapping] = useState<SwapEntry[]>([]);
	const [loading, setLoading] = useState<boolean>(false);
	const [statusMsg, setStatusMsg] = useState<string>("");
	const [selectedEventFilter, setSelectedEventFilter] = useState<string>("");
	const firstMessageGroup = config?.message_group_list_map ? Object.keys(config.message_group_list_map)[0] : "";

	useEffect(() => {
		fetchSwapPrefs();
		setSwapping(
			(config?.swapping || []).map((entry: any) => ({
				from: entry.from,
				to: entry.to,
				enabled: entry.enabled !== false,
				text: entry.text || "",
				title: entry.title || "",
				button_text: entry.button_text || "",
				deadline: entry.deadline || "",
				dialog_text: entry.dialog_text || "",
			}))
		);
	}, [config]);

	const fetchSwapPrefs = async () => {
		const res = await fetch("/api/admin/get-swap-prefs");
		const data = await res.json();
		const prefs = data.swap_prefs || [];
		setSwapPrefs(prefs);
		if (!selectedEventFilter && prefs.length > 0) {
			const eventOptions = Array.from(new Set<string>(prefs.map((pref: SwapPref) => pref.event))).sort().reverse();
			setSelectedEventFilter(eventOptions[0] || "");
		}
	};

	const handleUpdateConfig = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		const payload = {
			swapping: swapping.filter((entry) => entry.from && entry.to),
		};
		const res = await fetch("/api/admin/update-swapping-config", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(payload),
		});
		setLoading(false);
		if (res.ok) {
			setStatusMsg("Swap config saved!");
			setTimeout(() => setStatusMsg(""), 2000);
		}
	};

	const handleAddSwapGroup = () => {
		if (!firstMessageGroup) {
			return;
		}

		setSwapping((prev) => [
			...prev,
			{
				from: firstMessageGroup,
				to: firstMessageGroup,
				enabled: true,
				text: "",
				title: "",
				button_text: "",
				deadline: "",
				dialog_text: "",
			},
		]);
	};

	const handleRemoveSwapGroup = (index: number) => {
		setSwapping((prev) => prev.filter((_, i) => i !== index));
	};

	const handleSwapEntryChange = (index: number, patch: Partial<SwapEntry>) => {
		setSwapping((prev) =>
			prev.map((entry, i) => (i === index ? { ...entry, ...patch } : entry))
		);
	};

	const handleDeleteSwapPref = async (id: number) => {
		const res = await fetch(`/api/admin/delete-swap-pref/${id}`);
		fetchSwapPrefs();
		if (res.ok) {
			setStatusMsg("Swap pref deleted!");
			setTimeout(() => setStatusMsg(""), 2000);
		}
	};

	return (
		<div className="mb-8">
			<h3 className="text-xl font-bold mb-2">Message Swapping</h3>
			<p className="mb-2">Allow recipients to choose to receive their Lifted messages sent to one message group to another message group instead. This will essentially "move" their messages from one message group to the other message group.</p>
			<p className="mb-2">Each row defines a two-way swapping pair. Recipients can toggle between the two groups in that row.</p>
			<form className="mb-4" onSubmit={handleUpdateConfig}>
				<div className="flex flex-col gap-4 mb-3">
					{swapping.map((entry, index) => (
						<div key={index} className="border rounded-lg p-3">
							<div className="flex gap-4 mb-2 items-end flex-wrap">
								<label className="inline-flex items-center gap-2 mb-1">
									<input
										type="checkbox"
										checked={entry.enabled !== false}
										onChange={(e) => handleSwapEntryChange(index, { enabled: e.target.checked })}
										disabled={isReadOnlyAdmin}
									/>
									<span className="font-semibold">Enabled</span>
								</label>
							</div>
							<div className="flex gap-4 mb-2 items-end flex-wrap">
								<div>
									<label className="block font-semibold mb-1">Swap From</label>
									<MessageGroupSelector
										initialValue={entry.from}
										showNoneOption={false}
										onChange={(opt) => handleSwapEntryChange(index, { from: opt.key })}
										dropdown={true}
									/>
								</div>
								<div>
									<label className="block font-semibold mb-1">Swap To</label>
									<MessageGroupSelector
										initialValue={entry.to}
										showNoneOption={false}
										onChange={(opt) => handleSwapEntryChange(index, { to: opt.key })}
										dropdown={true}
									/>
								</div>
								<button
									type="button"
									className="px-3 py-2 rounded bg-red-100 text-red-700 hover:bg-red-200"
									onClick={() => handleRemoveSwapGroup(index)}
									title="Remove this swapping group"
									disabled={isReadOnlyAdmin}
								>
									🗑️
								</button>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
								<div>
									<label className="block font-semibold mb-1" htmlFor={`swap-title-${index}`}>Title</label>
									<input
										type="text"
										id={`swap-title-${index}`}
										className="border rounded px-2 py-1 w-full"
										value={entry.title || ""}
										onChange={(e) => handleSwapEntryChange(index, { title: e.target.value })}
									/>
								</div>
								<div>
									<label className="block font-semibold mb-1" htmlFor={`swap-button-${index}`}>Button Text</label>
									<input
										type="text"
										id={`swap-button-${index}`}
										className="border rounded px-2 py-1 w-full"
										value={entry.button_text || ""}
										onChange={(e) => handleSwapEntryChange(index, { button_text: e.target.value })}
									/>
								</div>
								<div>
									<label className="block font-semibold mb-1" htmlFor={`swap-deadline-${index}`}>Deadline</label>
									<input
										type="text"
										id={`swap-deadline-${index}`}
										className="border rounded px-2 py-1 w-full"
										value={entry.deadline || ""}
										onChange={(e) => handleSwapEntryChange(index, { deadline: e.target.value })}
									/>
								</div>
							</div>
							<label className="block font-semibold mb-1 mt-3" htmlFor={`swap-text-${index}`}>Message Swap Instructional Text</label>
							<input
								type="text"
								id={`swap-text-${index}`}
								className="border rounded px-2 py-1 w-full"
								value={entry.text}
								onChange={(e) => handleSwapEntryChange(index, { text: e.target.value })}
							/>
							<label className="block font-semibold mb-1 mt-3" htmlFor={`swap-dialog-${index}`}>Confirm Dialog Text</label>
							<textarea
								id={`swap-dialog-${index}`}
								className="border rounded px-2 py-1 w-full"
								rows={4}
								value={entry.dialog_text || ""}
								onChange={(e) => handleSwapEntryChange(index, { dialog_text: e.target.value })}
							/>
						</div>
					))}
				</div>
				<button
					type="button"
					className="bg-gray-200 text-cornell-blue font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition"
					onClick={handleAddSwapGroup}
					disabled={isReadOnlyAdmin}
				>
					Add Swapping Group
				</button>
			</form>
			<button
				type="button"
				className="bg-cornell-blue text-white font-semibold py-2 px-6 rounded-lg shadow hover:bg-cornell-red transition mb-4"
				onClick={handleUpdateConfig}
				disabled={loading || isReadOnlyAdmin}
			>
				{loading ? "Saving..." : "Save"}
			</button>
			{statusMsg && (
				<div className="text-green-600 font-semibold mb-4 text-center">{statusMsg}</div>
			)}
			<h4 className="text-lg font-bold mt-6 mb-2">Swap Prefs Table</h4>
			<p className="mb-2">The swap_prefs table. Num entries: {swapPrefs.length}</p>
			<p className="mb-2">Deleting will remove the pref (so no future messages will be moved), but you will have to manually move the existing messages back.</p>
			
						<div className="mb-4">
							<label htmlFor="event-filter" className="block font-medium text-gray-700 mb-2">Filter by Event</label>
							<select
								id="event-filter"
								className="border rounded px-3 py-2 w-full max-w-xs"
								value={selectedEventFilter}
								onChange={(e) => setSelectedEventFilter(e.target.value)}
							>
								{Array.from(new Set(swapPrefs.map(p => p.event))).sort().reverse().map(event => (
									<option key={event} value={event}>{event}</option>
								))}
								<option value="">All Events</option>
							</select>
						</div>
			
			<div className="ag-theme-alpine rounded-lg border border-gray-300" style={{ height: 300, width: "100%" }}>
				<AgGridReact
					columnDefs={[
												{ headerName: "ID", field: "id", wrapText: true, maxWidth: 80 },
						{ headerName: "Recipient Email", field: "recipient_email", wrapText: true, maxWidth: 200 },
						{ headerName: "Event", field: "event", wrapText: true, maxWidth: 100 },
						{ headerName: "Swap From", field: "message_group_from", wrapText: true, maxWidth: 120 },
						{ headerName: "Swap To", field: "message_group_to", wrapText: true, maxWidth: 120 },
						{ headerName: "Delete", field: "actions", cellRenderer: (params: any) => params.value, sortable: false, filter: false, resizable: false, maxWidth: 80 },
					]}
					rowData={swapPrefs
						.filter(pref => !selectedEventFilter || pref.event === selectedEventFilter)
						.sort((a, b) => b.id - a.id)
						.map(pref => ({
							id: pref.id,
							recipient_email: pref.recipient_email,
							event: pref.event,
							message_group_from: pref.message_group_from,
							message_group_to: pref.message_group_to,
							actions: (
								<button
									className="text-red-600 hover:text-red-800 p-1 text-base"
									title="Delete"
									onClick={() => handleDeleteSwapPref(pref.id)}
									style={{ lineHeight: 1 }}
									disabled={isReadOnlyAdmin}
								>
									<span style={{ fontSize: "1rem" }}>🗑️</span>
								</button>
							),
										}))}
					pagination={swapPrefs.length > 100}
					paginationPageSize={100}
					defaultColDef={{ cellStyle: { lineHeight: "1.5", padding: "8px" } }}
					enableCellTextSelection={true}
					ensureDomOrder={true}
				/>
			</div>
		</div>
	);
};
