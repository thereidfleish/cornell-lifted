import React, { useMemo, useState } from "react";
import { useGlobal } from "@/utils/GlobalContext";

type SwapCardsProps = {
	message_group: string;
};

const SwapCards: React.FC<SwapCardsProps> = ({ message_group }) => {
	const [loading, setLoading] = useState(false);
	const [statusMsg, setStatusMsg] = useState("");
	const [showConfirm, setShowConfirm] = useState(false);
	const { config } = useGlobal();
	const swapEntry = useMemo(
		() => config?.swapping?.find((entry) => entry.from === message_group && entry.enabled !== false),
		[config, message_group]
	);

	if (!swapEntry) {
		return null;
	}

	const handleSwap = async () => {
		setShowConfirm(false);
		setLoading(true);
		setStatusMsg("");
		const res = await fetch("/api/swap-messages", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ message_group }),
		});
		const data = await res.json().catch(() => ({}));
		if (data.swapped) {
			setStatusMsg("Cards swapped successfully! Reloading...");
			setTimeout(() => window.location.reload(), 1200);
		} else {
			setStatusMsg("Error swapping cards. Please try again or contact support.");
			setLoading(false);
		}
	};

	return (
		<div className="relative">
			<h5 className="font-bold mb-2">{swapEntry.title}</h5>
			{swapEntry.deadline && (
				<div className="mb-2 inline-flex items-center rounded-full bg-cornell-red px-3 py-1 text-xs font-semibold text-white">
					Deadline: {swapEntry.deadline}
				</div>
			)}
            <div
                className="mb-2 text-sm"
				dangerouslySetInnerHTML={{ __html: swapEntry.text || "" }}
            />
			{statusMsg && <div className="text-green-600 font-semibold mb-2">{statusMsg}</div>}
			<button
				className="px-4 py-2 bg-cornell-blue text-white text-sm rounded font-semibold hover:bg-cornell-red disabled:opacity-50"
				onClick={() => setShowConfirm(true)}
				disabled={loading}
			>
				{loading ? "Swapping..." : swapEntry.button_text}
			</button>
			{showConfirm && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
					<div className="bg-white p-6 rounded shadow-lg max-w-sm w-full">
						<h5 className="font-bold mb-2">Confirm Swap</h5>
						<p className="mb-4 whitespace-pre-line">{swapEntry.dialog_text}</p>
						<div className="flex gap-2 justify-end">
							<button
								className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
								onClick={() => setShowConfirm(false)}
								disabled={loading}
							>Cancel</button>
							<button
								className="px-3 py-1 rounded bg-cornell-blue text-white font-semibold hover:bg-cornell-red"
								onClick={handleSwap}
								disabled={loading}
							>Confirm</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default SwapCards;
