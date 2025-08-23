import React, { useEffect, useState } from "react";
import { useGlobal } from "@/utils/GlobalContext";

const SwapCards: React.FC = () => {
	const [loading, setLoading] = useState(false);
	const [statusMsg, setStatusMsg] = useState("");
	const [showConfirm, setShowConfirm] = useState(false);
	const { user, config } = useGlobal();

	const handleSwap = async () => {
		setShowConfirm(false);
		setLoading(true);
		setStatusMsg("");
		const res = await fetch("/api/swap-messages", { method: "POST" });
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
		<div className="p-4 border rounded bg-white">
			<h5 className="font-bold mb-2">Can't make it on the last day of classes?</h5>
            <div
                className="mb-2 text-sm"
                dangerouslySetInnerHTML={{ __html: config?.swap_text || "" }}
            />
			{statusMsg && <div className="text-green-600 font-semibold mb-2">{statusMsg}</div>}
			<button
				className="px-4 py-2 bg-cornell-blue text-white text-sm rounded font-semibold hover:bg-cornell-red disabled:opacity-50"
				onClick={() => setShowConfirm(true)}
				disabled={loading}
			>
				{loading ? "Swapping..." : "Swap My Cards to eLifted"}
			</button>
			{showConfirm && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
					<div className="bg-white p-6 rounded shadow-lg max-w-sm w-full">
						<h5 className="font-bold mb-2">Confirm Swap</h5>
						<p className="mb-4">Even if you're not sure you'll make it on the last day of classes, we strongly recommend choosing this option - otherwise, if you don't pick up your physical cards, you won't be able to view them virtually.
<br /><br />
You'll receive your cards as a PDF that you can print out!</p>
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
