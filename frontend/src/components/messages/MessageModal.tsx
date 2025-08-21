import React, { useEffect, useState, useRef } from "react";
import Loading from "@/components/Loading";
import { useGlobal } from "@/utils/GlobalContext";

export interface MessageModalProps {
    cardId: number | string | null;
    open: boolean;
    onClose: () => void;
    overrideHiddenMessage: boolean;
}

interface CardData {
    id: number;
    created_timestamp: string;
    message_group: string;
    sender_email: string;
    sender_name: string;
    recipient_email: string;
    recipient_name: string;
    message_content: string;
    attachment: string;
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

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm transition-opacity duration-300 ${animating ? "opacity-100" : "opacity-0"}`}
            style={{ pointerEvents: animating ? "auto" : "none" }}
        >
            <div
                ref={modalRef}
                className={`bg-white rounded-xl shadow-lg max-w-xl w-full p-6 relative transform transition-all duration-300 ${animating ? "scale-100 translate-y-0 opacity-100" : "scale-95 translate-y-8 opacity-0"}`}
            >
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
                                <a
                                    href={`/delete-message/${card.id}`}
                                    className="btn bg-cornell-red text-white rounded px-4 py-2 font-semibold hover:bg-cornell-blue transition"
                                >Delete</a>
                            </div>
                        )}
                        {/* Print options */}
                        {(!config?.hidden_cards.includes(card.message_group) || overrideHiddenMessage) && (
                            <div className="mt-4 text-center">
                                <a
                                    href={`/get-card-pdf/${card.id}`}
                                    className="btn bg-cornell-blue text-white rounded px-4 py-2 font-semibold hover:bg-cornell-red transition"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >Download PDF</a>
                            </div>
                        )}
                    </div>
                ) : null}
            </div>
        </div>
    );
}
