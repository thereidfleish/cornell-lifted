import React, { useState } from "react";
import Table, { TableHeader } from "@/components/Table";

const ADMIN_HEADERS: TableHeader[] = [
	{ key: "responded_timestamp", label: "Responded Timestamp" },
	{ key: "netid", label: "NetID" },
	{ key: "tap_name", label: "Name" },
	{ key: "accept_tap", label: "Accepted Tap" },
	{ key: "clear_schedule", label: "Clear Schedule" },
	{ key: "wear_clothing", label: "Wear White" },
	{ key: "monitor_inbox", label: "Monitor Inbox" },
	{ key: "notes", label: "Notes" },
	{ key: "pronouns", label: "Pronouns" },
	{ key: "phonetic_spelling", label: "Phonetic Spelling" },
	{ key: "allergens", label: "Allergens" },
	{ key: "delete", label: "Delete" },
];

const AddCandidateFormAndResponses: React.FC = () => {
	const [netid, setNetid] = useState("");
	const [name, setName] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [refreshKey, setRefreshKey] = useState(0);
	const [taps, setTaps] = useState<any[]>([]);

	React.useEffect(() => {
		fetch("/api/circle/get-taps")
			.then(res => res.ok ? res.json() : [])
			.then(taps => setTaps(Array.isArray(taps) ? taps : []));
	}, [refreshKey]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		if (!netid.trim() || !name.trim()) {
			setError("Both fields are required.");
			return;
		}
		setLoading(true);
		const formData = new FormData();
		formData.append("netID-input", netid.trim().toLowerCase());
		formData.append("name-input", name.trim());
		const res = await fetch("/api/circle/add-tap", {
			method: "POST",
			body: formData,
		});
		setLoading(false);
		if (res.ok) {
			setNetid("");
			setName("");
			setRefreshKey(k => k + 1);
		} else {
			setError("Failed to add candidate. Please try again.");
		}
	};

		const tableData = taps.map(tap => {
			let accepted = "";
			let bg = undefined;
			if (tap.accept_tap === 1) {
				accepted = "Yes";
				bg = "lightgreen";
			} else if (tap.accept_tap === 0) {
				accepted = "No";
				bg = "lightcoral";
			}
			return {
				responded_timestamp: tap.responded_timestamp,
				netid: tap.netid,
				tap_name: tap.tap_name,
				accept_tap: (
					<span style={{ backgroundColor: bg, padding: "2px 8px", borderRadius: 4 }}>{accepted}</span>
				),
				clear_schedule: tap.clear_schedule,
				wear_clothing: tap.wear_clothing,
				monitor_inbox: tap.monitor_inbox,
				notes: tap.notes || "",
				pronouns: tap.pronouns || "",
				phonetic_spelling: tap.phonetic_spelling || "",
				allergens: tap.allergens || "",
				delete: (
					<button
						className="text-red-600 hover:text-red-800 text-lg"
						title="Delete tap"
						onClick={async () => {
							await fetch(`/api/admin/delete-tap/${tap.netid}`);
							setRefreshKey(k => k + 1);
						}}
					>🗑️</button>
				),
			};
		});

	return (
		<div>
			<section className="mb-8">
				<h2 className="text-xl font-bold text-white mb-2">Add Candidate</h2>
				<p className="text-white mb-4">Add candidate to the tap pool. This will allow them to log in and accept or reject a tap</p>
				<form onSubmit={handleSubmit} className="mb-4">
					{error && <div className="bg-red-100 text-red-700 rounded p-2 mb-2">{error}</div>}
					<div className="mb-4">
						<label htmlFor="netID-input" className="block text-sm font-medium text-white mb-1">NetID</label>
									<input
										type="text"
										name="netID-input"
										id="netID-input"
										value={netid}
										onChange={e => setNetid(e.target.value)}
										required
										className="w-full px-3 py-2 rounded border border-gray-300"
										style={{ color: "white", backgroundColor: "#222" }}
									/>
					</div>
					<div className="mb-4">
						<label htmlFor="name-input" className="block text-sm font-medium text-white mb-1">Full Name (that appears on parcel)</label>
									<input
										type="text"
										name="name-input"
										id="name-input"
										value={name}
										onChange={e => setName(e.target.value)}
										required
										className="w-full px-3 py-2 rounded border border-gray-300"
										style={{ color: "white", backgroundColor: "#222" }}
									/>
					</div>
					<button type="submit" className="px-4 py-2 rounded bg-gray-900 text-white font-semibold" disabled={loading}>
						{loading ? "Adding..." : "Add Candidate"}
					</button>
				</form>
			</section>
			<section className="mb-8">
				<h2 className="text-xl font-bold text-white mb-2 mt-3">Tap Responses</h2>
				<Table headers={ADMIN_HEADERS} data={tableData} maxHeight={1000} />
			</section>
		</div>
	);
};

export default AddCandidateFormAndResponses;
