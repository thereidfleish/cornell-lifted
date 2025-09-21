import React, { useState } from "react";

interface AddCandidateFormProps {
	onRefresh: () => void;
}

const AddCandidateForm: React.FC<AddCandidateFormProps> = ({ onRefresh }) => {
	const [netid, setNetid] = useState("");
	const [name, setName] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

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
			onRefresh();
		} else {
			setError("Failed to add candidate. Please try again.");
		}
	};

	return (
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
	);
};

export default AddCandidateForm;