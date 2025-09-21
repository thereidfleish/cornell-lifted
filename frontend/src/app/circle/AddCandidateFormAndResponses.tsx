import React, { useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { themeQuartz } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

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

	// AG Grid column definitions
	const columnDefs = [
		{ headerName: "Responded Timestamp", field: "responded_timestamp", wrapText: true },
		{ headerName: "NetID", field: "netid", wrapText: true },
		{ headerName: "Name", field: "tap_name", wrapText: true },
		{ 
			headerName: "Accepted Tap", 
			field: "accept_tap", 
			cellRenderer: (params: any) => params.value,
			wrapText: true
		},
		{ headerName: "Clear Schedule", field: "clear_schedule", wrapText: true },
		{ headerName: "Wear White", field: "wear_clothing", wrapText: true },
		{ headerName: "Monitor Inbox", field: "monitor_inbox", wrapText: true },
		{ headerName: "Notes", field: "notes", wrapText: true, minWidth: 200 },
		{ headerName: "Pronouns", field: "pronouns", wrapText: true },
		{ headerName: "Phonetic Spelling", field: "phonetic_spelling", wrapText: true },
		{ headerName: "Allergens", field: "allergens", wrapText: true },
		{ 
			headerName: "Delete", 
			field: "delete", 
			cellRenderer: (params: any) => params.value,
			sortable: false, 
			filter: false
		},
	];

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
				<div className="ag-theme-alpine rounded-lg border border-gray-300" style={{ height: 600, width: "100%", minWidth: "1000px" }}>
					<AgGridReact
						columnDefs={columnDefs as any}
						rowData={tableData}
						pagination={tableData.length > 100}
						paginationPageSize={100}
						defaultColDef={{ 
							cellStyle: { lineHeight: "1.6", padding: "8px" },
							resizable: true,
							sortable: true,
							filter: true
						}}
					/>
				</div>
			</section>
		</div>
	);
};

export default AddCandidateFormAndResponses;
