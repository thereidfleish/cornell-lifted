import React from "react";

interface DeleteConfirmationProps {
    open: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    deleting?: boolean;
}

const DeleteConfirmation: React.FC<DeleteConfirmationProps> = ({ open, onConfirm, onCancel, deleting }) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-sm w-full text-center">
                <h3 className="text-xl font-bold text-cornell-red mb-4">Are you sure you want to delete this message?</h3>
                <p className="mb-6 text-gray-700">This action cannot be undone.</p>
                <div className="flex justify-center gap-4">
                    <button
                        className="bg-gray-200 text-gray-700 rounded-full px-5 py-2 font-semibold shadow hover:bg-gray-300 transition"
                        onClick={onCancel}
                        disabled={deleting}
                    >Cancel</button>
                    <button
                        className="bg-cornell-red text-white rounded-full px-5 py-2 font-semibold shadow hover:bg-cornell-blue transition disabled:opacity-50"
                        onClick={onConfirm}
                        disabled={deleting}
                    >{deleting ? "Deleting..." : "Delete"}</button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmation;
