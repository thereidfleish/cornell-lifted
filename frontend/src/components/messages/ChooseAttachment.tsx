import React, { useEffect, useState } from "react";

interface Attachment {
	id: number;
	attachment: string;
	count: number;
}

interface AttachmentPref {
	id: number;
	attachment_id: number;
	attachment: string;
}

type Props = {
	message_group: string;
};

const ChooseAttachment: React.FC<Props> = ({ message_group }) => {
	const [attachments, setAttachments] = useState<Attachment[]>([]);
	const [chosenPref, setChosenPref] = useState<AttachmentPref | null>(null);
	const [loading, setLoading] = useState(false);
	const [statusMsg, setStatusMsg] = useState("");

	const fetchData = async () => {
		setLoading(true);
		// Get attachments
		const res = await fetch(`/api/get-attachments/${message_group}`);
		const data = await res.json();
		setAttachments(data.attachments || []);

		// Get current attachment pref for this message group
		const prefRes = await fetch(`/api/get-attachment-pref/${message_group}`);
		const prefData = await prefRes.json();
		setChosenPref(prefData.attachment_pref || null);
		setLoading(false);
	};

	useEffect(() => {
		fetchData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [message_group]);

	const handleChoose = async (id: number) => {
		setLoading(true);
		const formData = new FormData();
		formData.append("id", String(id));
		const res = await fetch("/api/set-attachment-pref", {
			method: "POST",
			body: formData,
		});
		const data = await res.json().catch(() => ({}));
		setStatusMsg(data.status === "success" ? "Attachment chosen!" : data.status || "Error choosing attachment.");
		await fetchData();
		setTimeout(() => setStatusMsg("") , 2000);
	};

	const handleClear = async () => {
		if (!chosenPref) return;
		setLoading(true);
		const res = await fetch(`/api/delete-attachment-pref/${chosenPref.id}`);
		const data = await res.json().catch(() => ({}));
		setStatusMsg(data.status === "success" ? "Attachment cleared!" : data.status || "Error clearing attachment.");
		await fetchData();
		setTimeout(() => setStatusMsg("") , 2000);
	};

	return (
		<div className="relative">
			{loading && (
				<div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-10">
					<div className="text-lg font-semibold text-cornell-blue">Loading...</div>
				</div>
			)}
			<h4 className="font-bold mb-2">Choose Your Card Attachment!</h4>
			<p className="text-sm mb-2">You'll receive this alongside your cards! If you only want your cards, leave this blank. Hard deadline to select an attachment is <b>Sunday 4/27/25 at 11:59 PM!</b></p>
			{statusMsg && <div className="text-green-600 font-semibold mb-2">{statusMsg}</div>}
			<div className={loading ? "pointer-events-none opacity-50" : ""}>
				{chosenPref ? (
					<div className="mb-2">
						<span className="font-semibold">Current Attachment:</span> {attachments.find(a => a.id === chosenPref.attachment_id)?.attachment || "Unknown"}
						<button
							className="ml-2 px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
							onClick={handleClear}
						>
							Clear
						</button>
					</div>
				) : (
					<div className="mb-2 text-gray-700">No attachment chosen yet.</div>
				)}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
					{attachments.map(att => (
						<button
							key={att.id}
							className={`border rounded p-3 flex flex-col items-start ${chosenPref && chosenPref.attachment_id === att.id ? "bg-cornell-blue text-white" : "bg-white"} ${att.count < 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-100"}`}
							onClick={() => att.count > 0 && handleChoose(att.id)}
							disabled={att.count < 1}
						>
							<span className="font-semibold text-lg">{att.attachment}</span>
							<span className="text-sm">Available: {att.count}</span>
						</button>
					))}
				</div>
			</div>
		</div>
	);
};

export default ChooseAttachment;
