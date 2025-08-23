import React, { useState, useEffect } from "react";
// Removed react-icons import, using emoji instead
import { useGlobal } from "@/utils/GlobalContext";
import MessageGroupSelector from "@/components/MessageGroupSelector";
import Table from "@/components/Table";

interface SwapPref {
	id: number;
	recipient_email: string;
	message_group_from: string;
	message_group_to: string;
}

export default function SwappingOptions() {
	const { config } = useGlobal() as any;
	const [swapPrefs, setSwapPrefs] = useState<SwapPref[]>([]);
	const [swapFrom, setSwapFrom] = useState<string>(config.swap_from);
	const [swapTo, setSwapTo] = useState<string>(config.swap_to);
	const [swapText, setSwapText] = useState<string>(config.swap_text);
	const [loading, setLoading] = useState<boolean>(false);
	const [statusMsg, setStatusMsg] = useState<string>("");

	useEffect(() => {
		fetchSwapPrefs();
		// Optionally fetch current config for swapFrom, swapTo, swapText if available
	}, [config]);

	const fetchSwapPrefs = async () => {
		const res = await fetch("/api/admin/get-swap-prefs");
		const data = await res.json();
		setSwapPrefs(data.swap_prefs || []);
	};

	const handleUpdateConfig = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		const formData = new FormData();
		formData.append("swap-from", swapFrom);
		formData.append("swap-to", swapTo);
		formData.append("swap-text", swapText);
		const res = await fetch("/api/admin/update-swapping-config", {
			method: "POST",
			body: formData,
		});
		setLoading(false);
		if (res.ok) {
			setStatusMsg("Swap config saved!");
			setTimeout(() => setStatusMsg(""), 2000);
		}
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
			<p className="mb-2">Currently, only swapping from the physical Lifted group to the eLifted group for a particular semester is supported.</p>
			<p className="mb-2">Set to <b>None</b> to disable. <b>Be sure to turn this off right before you export the cards as PDFs!</b></p>
			<form className="mb-4" onSubmit={handleUpdateConfig}>
				<div className="flex gap-4 mb-2">
					<div>
						<label className="block font-semibold mb-1">Swap From</label>
						<MessageGroupSelector
							initialValue={swapFrom}
							showNoneOption={true}
							onChange={opt => setSwapFrom(opt.key)}
							dropdown={true}
						/>
					</div>
					<div>
						<label className="block font-semibold mb-1">Swap To</label>
						<MessageGroupSelector
							initialValue={swapTo}
							showNoneOption={false}
							onChange={opt => setSwapTo(opt.key)}
							dropdown={true}
						/>
					</div>
				</div>
				<label className="block font-semibold mb-1" htmlFor="swap-text">Message Swap Instructional Text</label>
				<p className="mb-2 text-gray-700">This text is shown on the messages page to the user. You can use HTML to style this.</p>
				<input
					type="text"
					id="swap-text"
					className="border rounded px-2 py-1 w-full"
					value={swapText}
					onChange={e => setSwapText(e.target.value)}
				/>
			</form>
			<button
				type="button"
				className="bg-cornell-blue text-white font-semibold py-2 px-6 rounded-lg shadow hover:bg-cornell-red transition mb-4"
				onClick={handleUpdateConfig}
				disabled={loading}
			>
				{loading ? "Saving..." : "Save"}
			</button>
			{statusMsg && (
				<div className="text-green-600 font-semibold mb-4 text-center">{statusMsg}</div>
			)}
			<h4 className="text-lg font-bold mt-6 mb-2">Swap Prefs Table</h4>
			<p className="mb-2">The swap_prefs table. Num entries: {swapPrefs.length}</p>
			<p className="mb-2">Deleting will remove the pref (so no future messages will be moved), but you will have to manually move the existing messages back.</p>
			<Table
				headers={[
					{ key: "recipient_email", label: "Recipient Email" },
					{ key: "message_group_from", label: "Swap From" },
					{ key: "message_group_to", label: "Swap To" },
					{ key: "actions", label: "Actions" },
				]}
				data={swapPrefs.map(pref => ({
					recipient_email: pref.recipient_email,
					message_group_from: pref.message_group_from,
					message_group_to: pref.message_group_to,
					actions: (
						<button
							className="text-red-600 hover:text-red-800 p-1 text-base"
							title="Delete"
							onClick={() => handleDeleteSwapPref(pref.id)}
							style={{ lineHeight: 1 }}
						>
							<span style={{ fontSize: "1rem" }}>🗑️</span>
						</button>
					),
				}))}
				maxHeight={300}
				className="mb-4"
			/>
		</div>
	);
};
