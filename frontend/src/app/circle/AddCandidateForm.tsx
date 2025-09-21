import React, { useState } from "react";
import PeopleSearch, { Person } from "@/components/PeopleSearch";

interface AddCandidateFormProps {
	onRefresh: () => void;
}

const AddCandidateForm: React.FC<AddCandidateFormProps> = ({ onRefresh }) => {
	const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
	const [name, setName] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const handleSelectPerson = (person: Person) => {
		setSelectedPerson(person);
		setName(person.Name); // Auto-fill the name but allow editing
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		if (!selectedPerson || !name.trim()) {
			setError("Please select a person and provide a name.");
			return;
		}
		setLoading(true);
		const formData = new FormData();
		formData.append("netID-input", selectedPerson.NetID.toLowerCase());
		formData.append("name-input", name.trim());
		const res = await fetch("/api/circle/add-tap", {
			method: "POST",
			body: formData,
		});
		setLoading(false);
		if (res.ok) {
			setSelectedPerson(null);
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
					<div className="bg-white p-4 rounded-lg border border-gray-300" style={{ color: "#000" }}>
						<PeopleSearch onSelect={handleSelectPerson} selectedPerson={selectedPerson} />
					</div>
				</div>
				
				{selectedPerson && (
					<div className="mb-4">
						<label htmlFor="name-input" className="block text-sm font-medium text-white mb-1">Full Name (you can edit this)</label>
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
						<p className="text-sm text-gray-300 mt-1">This is the name that will appear on the parcel. You can edit it if you prefer a different name or nickname.</p>
					</div>
				)}
				
				<button type="submit" className="px-4 py-2 rounded bg-gray-900 text-white font-semibold cursor-pointer" disabled={loading || !selectedPerson}>
					{loading ? "Adding..." : "Add Candidate"}
				</button>
			</form>
		</section>
	);
};

export default AddCandidateForm;