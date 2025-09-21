import React, { useState } from "react";

const LABELS = {
    accept_tap: "Accept or Reject the Tap",
    clear_schedule: "I will clear my schedule from 7:00 pm onward on Monday, September 29th.",
    wear_clothing: "I will wear white/light colors from 7:00 pm onward on Monday, September 29th.",
    monitor_inbox: "I will monitor my email inbox closely from now to September 29th.",
    notes: "If I did not check all the boxes above, explain any conflicts/concerns:",
    pronouns: "Preferred pronouns:",
    phonetic_spelling: "Phonetic pronunciation of my name:",
    allergens: "Any Allergens:",
    physical_accommodations: "Any Physical Accommodations:",
};

interface TapAcceptanceFormProps {
    tapName?: string;
    onSuccess?: () => void;
}

const TapAcceptanceForm: React.FC<TapAcceptanceFormProps> = ({ tapName, onSuccess }) => {
    const [form, setForm] = useState({
        accept_tap: "accept", // default to accept
        clear_schedule: false,
        wear_clothing: false,
        monitor_inbox: false,
        notes: "",
        pronouns: "",
        phonetic_spelling: "",
        allergens: "",
        physical_accommodations: "",
    });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, type, value } = e.target;
        let newValue: any = value;
        if (type === "checkbox") {
            newValue = (e.target as HTMLInputElement).checked;
        }
        setForm(prev => ({ ...prev, [name]: newValue }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        if (!form.accept_tap) {
            setError("Please accept or reject the tap.");
            return;
        }
        setShowConfirm(true);
    };

    const handleConfirm = async () => {
        setShowConfirm(false);
        setLoading(true);
        const formData = new FormData();
        Object.entries(form).forEach(([k, v]) => formData.append(k, String(v)));
        const res = await fetch("/api/circle/update-tap-response", {
            method: "POST",
            body: formData,
        });
        setLoading(false);
        const data = await res.json().catch(() => ({}));
        if (data.success) {
            setSuccess("Response submitted!");
            if (onSuccess) onSuccess();
            window.location.reload();
        } else {
            setError("Error submitting response. Please try again.");
        }
    };

    return (
        <div>
            <form
                className="my-2"
                style={{
                    backgroundColor: "white",
                    maxWidth: 800,
                    marginLeft: "auto",
                    marginRight: "auto",
                    border: "30px solid",
                    borderImage: "url('/images/circle/cp_outline.png') 105 round",
                    borderImageOutset: "20px",
                    backgroundImage: "url('/images/circle/cp_logo.png')",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "contain",
                }}
                onSubmit={handleSubmit}
            >
                <h4 className="text-center font-bold mb-2">Your response is requested by <b>Saturday, September 27th, 2025 at 11:59 PM.</b></h4>
                {tapName && <h3 className="text-center text-2xl font-bold mb-4">{tapName}</h3>}
                {error && <div className="bg-red-100 text-red-700 rounded p-2 mb-2"><h5 className="font-bold">Please fix the following errors:</h5><ul><li>{error}</li></ul></div>}
                {success && <div className="bg-green-100 text-green-700 rounded p-2 mb-2">{success}</div>}
                {/* Accept section always visible */}
                <div className="mb-2">
                    <div className="flex items-center mb-2">
                        <input type="radio" name="accept_tap" value="accept" checked={form.accept_tap === "accept"} onChange={handleChange} id="accept_tap_accept" className="mr-2" />
                        <label htmlFor="accept_tap_accept">I accept this tap, and confirm the following</label>
                    </div>
                    <div className="ml-4 mb-2">
                        <div className="flex items-center mb-2">
                            <input type="checkbox" name="clear_schedule" checked={form.clear_schedule} onChange={handleChange} id="clear_schedule" className="mr-2" />
                            <label htmlFor="clear_schedule">{LABELS.clear_schedule}</label>
                        </div>
                        <div className="flex items-center mb-2">
                            <input type="checkbox" name="wear_clothing" checked={form.wear_clothing} onChange={handleChange} id="wear_clothing" className="mr-2" />
                            <label htmlFor="wear_clothing">{LABELS.wear_clothing}</label>
                        </div>
                        <div className="flex items-center mb-2">
                            <input type="checkbox" name="monitor_inbox" checked={form.monitor_inbox} onChange={handleChange} id="monitor_inbox" className="mr-2" />
                            <label htmlFor="monitor_inbox">{LABELS.monitor_inbox}</label>
                        </div>
                        <div className="flex items-center mb-2">
                            <label htmlFor="notes" className="mr-2">{LABELS.notes}</label>
                            <textarea name="notes" value={form.notes} onChange={handleChange} id="notes" rows={2} className="form-control px-2 py-1 rounded border border-gray-300" />
                        </div>
                        <div className="flex items-center mb-2">
                            <label htmlFor="pronouns" className="mr-2">{LABELS.pronouns}</label>
                            <input type="text" name="pronouns" value={form.pronouns} onChange={handleChange} id="pronouns" className="form-control px-2 py-1 rounded border border-gray-300" />
                        </div>
                        <div className="flex items-center mb-2">
                            <label htmlFor="phonetic_spelling" className="mr-2">{LABELS.phonetic_spelling}</label>
                            <input type="text" name="phonetic_spelling" value={form.phonetic_spelling} onChange={handleChange} id="phonetic_spelling" className="form-control px-2 py-1 rounded border border-gray-300" />
                        </div>
                        <div className="flex items-center mb-2">
                            <label htmlFor="allergens" className="mr-2">{LABELS.allergens}</label>
                            <input type="text" name="allergens" value={form.allergens} onChange={handleChange} id="allergens" className="form-control px-2 py-1 rounded border border-gray-300" />
                        </div>
                        <div className="flex items-center mb-2">
                            <label htmlFor="physical_accommodations" className="mr-2">{LABELS.physical_accommodations}</label>
                            <input type="text" name="physical_accommodations" value={form.physical_accommodations} onChange={handleChange} id="physical_accommodations" className="form-control px-2 py-1 rounded border border-gray-300" />
                        </div>
                    </div>
                </div>
                {/* Reject section always visible, underneath accept section */}
                <div className="mb-2 mt-6">
                    <div className="flex items-center mb-2">
                        <input type="radio" name="accept_tap" value="reject" checked={form.accept_tap === "reject"} onChange={handleChange} id="accept_tap_reject" className="mr-2" />
                        <label htmlFor="accept_tap_reject">I reject this tap, will return this parcel, and shall maintain the society's secrecy.</label>
                    </div>
                </div>
                <div className="text-center">
                    <button type="submit" className="px-4 py-2 rounded bg-gray-900 text-white font-semibold mt-2" disabled={loading}>{loading ? "Submitting..." : "Submit"}</button>
                </div>
            </form>
            {showConfirm && (
                <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm transition-opacity duration-300`}
                >
                    <div className="bg-white rounded shadow-lg p-6 max-w-sm w-full">
                        <h3 className="text-lg font-bold mb-4">Are you sure you want to submit?</h3>
                        <div className="flex justify-end gap-2">
                            <button className="px-4 py-2 rounded bg-gray-300" onClick={() => setShowConfirm(false)}>Cancel</button>
                            <button className="px-4 py-2 rounded bg-gray-900 text-white font-semibold" onClick={handleConfirm}>Yes, Submit</button>
                        </div>
                    </div>
                </div>
            )}
            <p className="text-center text-white pt-5">Remember, please keep the existence and contents of this website and your tap confidential.</p>
            <p className="text-center text-white py-2">If you have any questions, please reach out to whoever tapped you or wrote you a letter.</p>
        </div>
    );
};

export default TapAcceptanceForm;
