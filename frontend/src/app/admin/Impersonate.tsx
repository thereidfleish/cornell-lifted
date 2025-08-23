import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useGlobal } from "@/utils/GlobalContext";

export default function Impersonate() {
	const [netid, setNetid] = useState("");
	const [loading, setLoading] = useState(false);
	const [statusMsg, setStatusMsg] = useState("");
	const { refreshConfig } = useGlobal() as any;
	const router = useRouter();

	const handleImpersonate = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setStatusMsg("");
		const formData = new FormData();
		formData.append("impersonate_netid", netid);
		const res = await fetch("/api/admin/impersonate", {
			method: "POST",
			body: formData,
		});
		const data = await res.json().catch(() => ({}));
		setLoading(false);
		if (res.ok && data.status) {
			setStatusMsg(data.status);
			refreshConfig();
			setTimeout(() => {
				router.push("/messages");
			}, 500);
		} else {
			setStatusMsg("Failed to impersonate user.");
			setTimeout(() => setStatusMsg("") , 2500);
		}
	};

	return (
		<div className="mb-8">
			<h3 className="text-xl font-bold mb-2">Impersonate User</h3>
			<p>Enter a NetID to "impersonate" another user. This will "sign you in" as this user, so you can see what they see. This is useful for testing purposes.</p>
			<form className="flex items-center gap-4 mb-4" onSubmit={handleImpersonate}>
				<input
					type="text"
					className="form-control w-48 border rounded px-3 py-2"
					id="impersonate_netid"
					name="impersonate_netid"
					placeholder="atn45"
					value={netid}
					onChange={e => setNetid(e.target.value)}
					required
				/>
				<button
					type="submit"
					className="bg-cornell-blue text-white font-semibold py-2 px-6 rounded-lg shadow hover:bg-cornell-red transition"
					disabled={loading || !netid}
				>
					{loading ? "Impersonating..." : "Impersonate"}
				</button>
			</form>
			{statusMsg && (
				<div className="text-green-600 font-semibold mb-2">{statusMsg}</div>
			)}
		</div>
	);
}
