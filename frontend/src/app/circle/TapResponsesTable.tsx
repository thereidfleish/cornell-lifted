import React, { useState, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import { themeQuartz } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

interface TapResponsesTableProps {
	refreshKey: number;
	showDeleteButton: boolean; // Whether to show delete buttons (write permission required)
	onRefresh: () => void;
}

const TapResponsesTable: React.FC<TapResponsesTableProps> = ({ refreshKey, showDeleteButton, onRefresh }) => {
	const [taps, setTaps] = useState<any[]>([]);

	useEffect(() => {
		fetch("/api/circle/get-taps")
			.then(res => res.ok ? res.json() : [])
			.then(taps => setTaps(Array.isArray(taps) ? taps : []));
	}, [refreshKey]);

	// AG Grid column definitions
	const columnDefs = [
		{ headerName: "Responded Timestamp", field: "responded_timestamp", wrapText: true, width: 150 },
		{ headerName: "NetID", field: "netid", wrapText: true, width: 80 },
		{ headerName: "Name", field: "tap_name", wrapText: true, width: 200 },
		{ 
			headerName: "Accepted Tap", 
			field: "accept_tap", 
			cellRenderer: (params: any) => params.value,
			wrapText: true,
			width: 120
		},
		{ headerName: "Clear Schedule", field: "clear_schedule", wrapText: true, width: 130 },
		{ headerName: "Wear White", field: "wear_clothing", wrapText: true, width: 120 },
		{ headerName: "Monitor Inbox", field: "monitor_inbox", wrapText: true, width: 130 },
		{ headerName: "Notes", field: "notes", wrapText: true, minWidth: 200 },
		{ headerName: "Pronouns", field: "pronouns", wrapText: true, width: 100 },
		{ headerName: "Phonetic Spelling", field: "phonetic_spelling", wrapText: true, width: 150 },
		{ headerName: "Allergens", field: "allergens", wrapText: true, width: 100 },
		{ headerName: "Physical Accommodations", field: "physical_accommodations", wrapText: true, width: 180 },
		...(showDeleteButton ? [{ 
			headerName: "Delete", 
			field: "delete", 
			cellRenderer: (params: any) => params.value,
			sortable: false, 
			filter: false
		}] : []),
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
		
		const baseData = {
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
			physical_accommodations: tap.physical_accommodations || "",
		};

		if (showDeleteButton) {
			return {
				...baseData,
				delete: (
					<button
						className="text-red-600 hover:text-red-800 text-lg"
						title="Delete tap"
						onClick={async () => {
							await fetch(`/api/admin/delete-tap/${tap.netid}`);
							onRefresh();
						}}
					>🗑️</button>
				),
			};
		}

		return baseData;
	});

	return (
		<section className="mb-8">
			<h2 className="text-xl font-bold text-white mb-2 mt-3">Tap Responses</h2>
			<div className="ag-theme-alpine rounded-lg border border-gray-300" style={{ height: 600, width: "100%", minWidth: "1000px" }}>
				<AgGridReact
					columnDefs={columnDefs as any}
					rowData={tableData}
				/>
			</div>
		</section>
	);
};

export default TapResponsesTable;