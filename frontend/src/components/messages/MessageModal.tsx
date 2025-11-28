import React, { useEffect, useState, useRef } from "react";
import Loading from "@/components/Loading";
import { useGlobal } from "@/utils/GlobalContext";
import { CardData } from "@/types/User";
import DeleteConfirmation from "@/components/DeleteConfirmation";
import SnowAccumulation from "@/components/SnowAccumulation";

export interface MessageModalProps {
    cardId: number | string | null;
    open: boolean;
    onClose: () => void;
    overrideHiddenMessage: boolean;
}

export default function MessageModal({
    cardId,
    open,
    onClose,
    overrideHiddenMessage,
}: MessageModalProps) {
    const [card, setCard] = useState<CardData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const { user, config } = useGlobal();
    const modalRef = useRef<HTMLDivElement>(null);
    const [show, setShow] = useState(false);
    const [animating, setAnimating] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loadingPdf, setLoadingPdf] = useState(false);
    const [pdfError, setPdfError] = useState("");

    useEffect(() => {
        if (!open || !cardId) return;
        setLoading(true);
        setError("");
        fetch(`/api/get-card-json/${cardId}`)
            .then((res) => res.ok ? res.json() : Promise.reject(res))
            .then((data) => {
                setCard(data);
                setLoading(false);
            })
            .catch(() => {
                setError("Error loading message. Try refreshing the page or try again later. Please report this to lifted@cornell.edu!!");
                setLoading(false);
            });
    }, [cardId, open]);

    useEffect(() => {
        if (open) {
            setShow(true);
            setTimeout(() => setAnimating(true), 10); // Trigger animation after mount
            document.body.style.overflow = "hidden";
            document.body.style.touchAction = "none";
            document.documentElement.style.overflow = "hidden";
            document.documentElement.style.touchAction = "none";
        } else {
            setAnimating(false);
            setTimeout(() => setShow(false), 250); // Wait for animation
            document.body.style.overflow = "";
            document.body.style.touchAction = "";
            document.documentElement.style.overflow = "";
            document.documentElement.style.touchAction = "";
        }
        return () => {
            document.body.style.overflow = "";
            document.body.style.touchAction = "";
            document.documentElement.style.overflow = "";
            document.documentElement.style.touchAction = "";
        };
    }, [open]);

    // Dismiss modal when clicking outside
    useEffect(() => {
        if (!show) return;
        const handleClick = (e: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [show, onClose]);

    // Modal logic
    if (!show) return null;

    async function handleDelete() {
        setDeleting(true);
        try {
            const res = await fetch(`/api/delete-message/${card?.id}`, { method: "POST" });
            const data = await res.json();
            if (data.deleted === true) {
                window.location.reload();
            } else {
                setDeleting(false);
            }
        } catch {
            setDeleting(false);
        }
    }

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm transition-opacity duration-300 ${animating ? "opacity-100" : "opacity-0"}`}
            style={{ pointerEvents: animating ? "auto" : "none" }}
        >
            <div
                ref={modalRef}
                className={`bg-white rounded-xl shadow-lg max-w-xl w-full p-6 relative transform transition-all duration-300 ${animating ? "scale-100 translate-y-0 opacity-100" : "scale-95 translate-y-8 opacity-0"}`}
                style={{ overflow: 'visible' }}
            >
                <SnowAccumulation />
                <button
                    className="absolute top-3 right-3 text-gray-400 hover:text-cornell-red text-4xl cursor-pointer"
                    onClick={onClose}
                    aria-label="Close"
                >
                    &times;
                </button>
                <h2 className="text-2xl font-bold text-cornell-blue mb-2 text-center">Your Lifted Message</h2>
                {loading ? (
                    <Loading />
                ) : error ? (
                    <div className="text-red-600 text-center py-4">{error}</div>
                ) : card ? (
                    <div>
                        <h4 className="text-center text-cornell-blue text-lg mb-2">To: {card.recipient_name} ({card.recipient_email.split("@")[0]})</h4>
                        <div className="lifted-card p-4 rounded-xl bg-blue-100/40" style={{ overflowY: "auto", maxHeight: "60vh" }}>
                            <p className="message-content whitespace-pre-line text-lg">{card.message_content}</p>
                        </div>
                        <h4 className="text-center text-cornell-blue text-lg mt-2">From: {card.sender_name}</h4>
                        {card.attachment && (
                            <p className="text-center mt-2">The recipient chose to receive a <b>{card.attachment}</b> alongside this message</p>
                        )}
                        <p className="text-xs text-gray-500 text-center mt-2">Message written at {card.created_timestamp}</p>
                        {/* Edit/Delete options */}
                        {user?.user?.email === card.sender_email && card.message_group === config?.form_message_group && (
                            <div className="flex justify-center gap-4 mt-4">
                                <a
                                    href={`/edit-message/${card.id}`}
                                    className="btn bg-cornell-blue text-white rounded px-4 py-2 font-semibold hover:bg-cornell-red transition"
                                >Edit</a>
                                <button
                                    type="button"
                                    className="btn bg-cornell-red text-white rounded px-4 py-2 font-semibold hover:bg-cornell-blue transition disabled:opacity-50"
                                    disabled={deleting}
                                    onClick={() => setShowConfirm(true)}
                                >
                                    {deleting ? "Deleting..." : "Delete"}
                                </button>
                            </div>
                        )}
                        <DeleteConfirmation
                            open={showConfirm}
                            onConfirm={() => { setShowConfirm(false); handleDelete(); }}
                            onCancel={() => setShowConfirm(false)}
                            deleting={deleting}
                            title="Are you sure you want to delete this message?"
                            description="This action cannot be undone."
                        />
                        {/* Print options */}
                        {(!config?.hidden_cards.includes(card.message_group) || overrideHiddenMessage) && (
                            <div className="mt-4 text-center">
                                <div className="mb-2 text-cornell-blue font-semibold text-base">
                                    Want to print your card?
                                </div>
                                <div className="mb-4 text-gray-700 text-sm">
                                    Either print with 100% size on normal paper and cut it out, or insert a properly sized card into your printer (contact us for card sizes)!
                                </div>
                                <button
                                    className="btn bg-cornell-blue text-white rounded px-4 py-2 font-semibold hover:bg-cornell-red transition disabled:opacity-50"
                                    disabled={deleting || loadingPdf}
                                    onClick={async () => {
                                        setLoadingPdf(true);
                                        setPdfError("");
                                        try {
                                            const res = await fetch(`/api/get-card-pdf/${card.id}`);
                                            if (res.ok) {
                                                const blob = await res.blob();
                                                const url = window.URL.createObjectURL(blob);
                                                window.open(url, "_blank");
                                            } else {
                                                setPdfError("Error generating PDF. Please try again later or contact lifted@cornell.edu.");
                                            }
                                        } catch {
                                            setPdfError("Error generating PDF. Please try again later or contact lifted@cornell.edu.");
                                        } finally {
                                            setLoadingPdf(false);
                                        }
                                    }}
                                >
                                    {loadingPdf ? "Converting PDF..." : "Download PDF"}
                                </button>
                                {pdfError && (
                                    <div className="text-red-600 text-sm mt-2">{pdfError}</div>
                                )}
                            </div>
                        )}
                    </div>
                ) : null}
            </div>
        </div>
    );
}
