"use client";
import React, { useState, useEffect } from "react";
import Loading from "@/components/Loading";
import PeopleSearch, { Person } from "@/components/PeopleSearch";
import MessageGroupSelector from "@/components/MessageGroupSelector";
import { useGlobal } from "@/utils/GlobalContext";
import { CardData } from "@/types/User";

export default function SendMessageForm({ editMode = false, cardData }: { editMode?: boolean; cardData?: CardData }) {
    // Form state
    const [senderName, setSenderName] = useState(cardData?.sender_name || "");
    const [recipientName, setRecipientName] = useState(cardData?.recipient_name || "");
    const [recipientNetID, setRecipientNetID] = useState(cardData?.recipient_email ? cardData.recipient_email.split("@")[0] : "");
    const [messageContent, setMessageContent] = useState(cardData?.message_content || "");
    const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
    const [formErrors, setFormErrors] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [formDescription, setFormDescription] = useState<string>("");
    const { user, config } = useGlobal();
    const [dialog, setDialog] = useState<{ type: "success" | "error"; message: string; recipientEmail?: string } | null>(null);
    const [adminOverride, setAdminOverride] = useState(false);
    const [adminMessageGroup, setAdminMessageGroup] = useState(cardData?.message_group || "");
    const [adminSenderEmail, setAdminSenderEmail] = useState(cardData?.sender_email || "");
    const [adminRecipientEmail, setAdminRecipientEmail] = useState(cardData?.recipient_email || "");
    const [sendYblEmail, setSendYblEmail] = useState(false);

    // Select person logic
    function handleSelectPerson(person: Person) {
        setSelectedPerson(person);
        setRecipientNetID(person.NetID);
    }

    // Fetch form description and user info on mount
    useEffect(() => {
        async function fetchDescription() {
            setFormDescription(""); // Clear before loading
            setLoadingFormDescription(true);
            try {
                const res = await fetch("/api/get-form-description");
                const data = await res.json();
                setFormDescription(data.form_description || "");
            } catch (err) {
                setFormDescription("<p>Could not load form description.</p>");
            }
            setLoadingFormDescription(false);
        }
        fetchDescription();
    }, []);

    // Form validation
    function validateForm() {
        const errors: string[] = [];
        if (!senderName) errors.push("Sender name is required.");
        if (!recipientName) errors.push("Recipient name is required.");
        if (adminOverride) {
            if (!adminMessageGroup) errors.push("Message group is required (admin override).");
            if (!adminSenderEmail) errors.push("Sender email is required (admin override).");
            if (!adminRecipientEmail) errors.push("Recipient email is required (admin override).");
        } else {
            if (!recipientNetID) errors.push("Recipient NetID is required.");
        }
        if (!messageContent) errors.push("Message content is required.");
        setFormErrors(errors);
        return errors.length === 0;
    }

    // Submit handler
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!validateForm()) return;
        setSubmitting(true);
        try {
            const payload: any = {
                sender_name: senderName,
                recipient_name: recipientName,
                message_content: messageContent
            };
            if (adminOverride || (editMode && user?.user?.admin_write_perm)) {
                payload.message_group = adminMessageGroup;
                payload.sender_email = adminSenderEmail;
                payload.recipient_email = adminRecipientEmail;
                if (editMode && adminOverride) {
                    payload.send_ybl_email = sendYblEmail;
                }
            } else if (editMode) {
                payload.recipient_netid = recipientNetID;
            } else {
                payload.recipient_netid = recipientNetID;
            }
            let apiUrl = "/api/send-message";
            if (editMode) {
                apiUrl = `/api/edit-message/${cardData?.id}`;
            }
            const res = await fetch(`${apiUrl}${(adminOverride) ? '?show_admin_overrides=true' : ''}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            setSubmitting(false);
            if (res.ok && data.message_confirmation) {
                setDialog({
                    type: "success",
                    message: editMode ? "Message successfully updated!" : "Message successfully sent!",
                    recipientEmail: data.recipient_email
                });
            } else {
                setDialog({
                    type: "error",
                    message: data?.error || `Failed to ${editMode ? "update" : "send"} message. Please try again later.  Please send an email to lifted@cornell.edu to report this!!`
                });
            }
        } catch (err) {
            setSubmitting(false);
            setDialog({
                type: "error",
                message: `Failed to ${editMode ? "update" : "send"} message. Please try again later.  Please send an email to lifted@cornell.edu to report this!!`
            });
        }
    }

    // Add loading state for form description
    const [loadingFormDescription, setLoadingFormDescription] = useState(false);

    return (
        <main className="bg-[#f4fbf3] font-tenor">
            {/* Hero Section */}
            <section className="relative py-16 flex flex-col items-center">
                <div className="flex flex-col items-center">
                    <img
                        src="../images/logo.png"
                        width={250}
                        alt="Cornell Lifted Logo"
                        className="mx-auto mb-8 transition-transform duration-300 hover:scale-105"
                    />
                    <h2 className="text-cornell-red font-schoolbell text-4xl mb-2 font-bold text-center">Send a Lifted Message</h2>
                    <p className="text-lg text-center text-gray-700 mb-6">Share gratitude and appreciation with someone special</p>
                </div>
            </section>
            {/* Main Content Section */}
            <section className="max-w-3xl mx-auto bg-white rounded-xl shadow p-8 mb-12">
                {/* Form Description from API */}
                {loadingFormDescription ? (
                    <div className="mb-6 flex justify-center items-center">
                        <Loading />
                    </div>
                ) : formDescription && (
                    <>
                        <style>{`.prose a { text-decoration: underline; text-decoration-color: #b31b1b; }`}</style>
                        <div className="mb-6 text-gray-700 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: formDescription }} />
                    </>
                )}
                {/* User Banner */}
                {user && (
                    <div className="w-full bg-blue-100 text-cornell-blue rounded-lg p-2 mb-4 font-sm shadow-sm border border-blue-200">
                        Hi, {user.user?.name}! You are signed in as {user.user?.email}
                    </div>
                )}
                {/* Admin Override Button */}
                {user?.user?.admin_write_perm && (
                    <div className="mb-6">
                        <button
                            type="button"
                            className={`bg-cornell-blue text-white rounded-full px-5 py-2 font-semibold shadow hover:bg-cornell-red transition ${adminOverride ? 'bg-cornell-red' : ''}`}
                            onClick={() => setAdminOverride(v => !v)}
                        >
                            {adminOverride ? 'Disable Admin Overrides' : 'Enable Admin Overrides'}
                        </button>
                        <p className="mt-2 text-sm text-gray-700">Click this to {adminOverride ? "return to normal mode" : "edit all fields.  Use this to input custom data, such as sending a Lifted message on someone's behalf."}</p>
                    </div>
                )}

                {/* Dialogs for success/error */}
                {dialog && dialog.type === "success" && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm transition-opacity duration-300">
                        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
                            <h3 className="text-2xl font-bold text-cornell-blue mb-4">{editMode ? "Message Edited!" : "Message Sent!"}</h3>
                            {editMode ? (
                                <p className="mb-2 text-gray-700">Your Lifted message to <span className="font-semibold text-cornell-red">{dialog?.recipientEmail}</span> was edited successfully.</p>
                            ) : (
                                <>
                                    <p className="mb-2 text-gray-700">Your Lifted message to <span className="font-semibold text-cornell-red">{dialog.recipientEmail}</span> was submitted successfully!  You can view it in your sent messages below.</p>
                                    <p className="mb-2 text-gray-700">Your recipient was just notified that they've been Lifted, but they won't get to see your message until the last day of classes!</p>
                                    <p className="mb-2 text-gray-700">To stay up-to-date with any last-minute reminders or changes, and to help Lift us, follow <a href="https://www.instagram.com/cornelllifted">@cornelllifted</a> on Instagram.</p>
                                </>
                            )}
                            <div className="mt-6 flex flex-col gap-3">
                                {!editMode && (
                                    <button
                                        className="bg-cornell-blue text-white rounded-full px-5 py-2 font-semibold shadow hover:bg-cornell-red transition"
                                        onClick={() => window.location.reload()}
                                    >
                                        Send Another Message
                                    </button>
                                )}
                                <a
                                    href="/messages"
                                    className="bg-gray-100 text-cornell-blue rounded-full px-5 py-2 font-semibold shadow hover:bg-cornell-blue hover:text-white transition text-center"
                                >
                                    View Your Sent Messages
                                </a>
                            </div>
                        </div>
                    </div>
                )}
                {dialog && dialog.type === "error" && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm transition-opacity duration-300">
                        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
                            <h3 className="text-2xl font-bold text-red-700 mb-4">Error</h3>
                            <p className="mb-2 text-gray-700">{dialog.message}</p>
                            <div className="mt-6">
                                <button
                                    className="bg-cornell-red text-white rounded-full px-5 py-2 font-semibold shadow hover:bg-cornell-blue transition"
                                    onClick={() => setDialog(null)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <form className="space-y-6" onSubmit={handleSubmit}>
                    {/* Admin Override Fields: Message Group Selector (only show if adminOverride is enabled) */}
                    {adminOverride && (
                        <div>
                            <label className="block font-bold text-cornell-blue mb-1">Select Message Group</label>
                            <MessageGroupSelector
                                initialValue={adminMessageGroup}
                                onChange={val => setAdminMessageGroup(val.key)}
                                showNoneOption={false}
                                className="mb-2"
                            />
                            <p className="text-sm text-gray-500">(Admin Only) Message group that the card should be placed in.</p>
                        </div>
                    )}
                    {/* Sender Info */}
                    <div>
                        <label className="block font-bold text-cornell-blue mb-1">👤 {(adminOverride || (editMode && user?.user?.admin_write_perm)) ? "Sender's Name" : "Your Name"}</label>
                        <input
                            type="text"
                            className="w-full rounded-lg border border-gray-300 p-3 mb-2"
                            placeholder="Your name (or 'Anonymous')"
                            value={senderName}
                            onChange={e => setSenderName(e.target.value)}
                        />
                        <p className="text-sm text-gray-500">This is your name that will appear on the card. If you want the letter to be anonymous, you can list your name as "Anonymous".</p>
                    </div>
                    {/* Recipient Info */}
                    <div>
                        <label className="block font-bold text-cornell-blue mb-1">📬 Recipient's Name</label>
                        <input
                            type="text"
                            className="w-full rounded-lg border border-gray-300 p-3 mb-2"
                            placeholder="Recipient's name"
                            value={recipientName}
                            onChange={e => setRecipientName(e.target.value)}
                        />
                        <p className="text-sm text-gray-500">This is the recipient's name that will appear on the card.</p>
                    </div>

                    {/* Admin Override Fields (only show if adminOverride is enabled) */}
                    {adminOverride && (
                        <>
                            <div>
                                <label className="block font-bold text-cornell-blue mb-1">Sender's Email</label>
                                <input
                                    type="text"
                                    className="w-full rounded-lg border border-gray-300 p-3 mb-2"
                                    placeholder="Sender's full email (e.g. rf377@cornell.edu)"
                                    value={adminSenderEmail}
                                    onChange={e => setAdminSenderEmail(e.target.value)}
                                />
                                <p className="text-sm text-gray-500">(Admin Only) Enter the sender's FULL email (preferably Cornell so they can log in), such as rf377@cornell.edu. DO NOT enter a NetID!</p>
                            </div>
                            <div>
                                <label className="block font-bold text-cornell-blue mb-1">Recipient's Email</label>
                                <input
                                    type="text"
                                    className="w-full rounded-lg border border-gray-300 p-3 mb-2"
                                    placeholder="Recipient's full email (e.g. rf377@cornell.edu)"
                                    value={adminRecipientEmail}
                                    onChange={e => setAdminRecipientEmail(e.target.value)}
                                />
                                <p className="text-sm text-gray-500">(Admin Only) Enter the recipient's FULL email (preferably Cornell so they can log in), such as rf377@cornell.edu. DO NOT enter a NetID!</p>
                            </div>
                            {editMode && (
                                <div className="flex items-center mt-4 mb-1">
                                    <input
                                        type="checkbox"
                                        id="sendYblEmail"
                                        checked={sendYblEmail}
                                        onChange={e => setSendYblEmail(e.target.checked)}
                                        className="mr-2"
                                    />
                                    <label htmlFor="sendYblEmail" className="font-bold text-cornell-blue">Send You've Been Lifted Email?</label>
                                </div>
                            )}
                            {editMode && (
                                <p className="text-sm text-gray-500">(Admin Only) Send "You've been Lifted!" email (only check this if you edited the recipient email on an existing message)</p>
                            )}
                        </>
                    )}
                    {/* In edit mode, do not show PeopleSearch at all, regardless of admin status */}
                    {editMode ? (
                        !adminOverride && (
                            <div>
                                <label className="block font-bold text-cornell-blue mb-1">Recipient's Email</label>
                                <div className="w-full rounded-lg border border-gray-300 p-3 mb-2 bg-gray-100 text-gray-700">
                                    {cardData?.recipient_email}
                                </div>
                                <p className="text-sm text-gray-500">To change the recipient email, please email <a href="mailto:lifted@cornell.edu" className="underline text-cornell-blue">lifted@cornell.edu</a>.</p>
                            </div>
                        )
                    ) : (
                        !adminOverride && <PeopleSearch onSelect={handleSelectPerson} selectedPerson={selectedPerson} />
                    )}
                    {/* Message Content */}
                    <div>
                        <label className="block font-bold text-cornell-blue mb-1">💌 Your Message</label>
                        <textarea
                            className="w-full rounded-lg border border-gray-300 p-3 mb-2"
                            placeholder="Thanks for being an inspiration to all the dining hall cashiers out there, including me! Your food at Okenshields is mid but your music is fire; you gotta teach me how to DJ one day!"
                            value={messageContent}
                            onChange={e => setMessageContent(e.target.value)}
                            rows={5}
                        />
                        <p className="text-sm text-gray-500">Please limit your note to no more than 150 words to ensure it fits on the card.</p>
                    </div>
                    {/* Error messages */}
                    {formErrors.length > 0 && (
                        <div className="mt-3 bg-red-100 border border-red-300 rounded-lg p-4 text-red-700 mb-4 text-left">
                            <h5 className="font-bold mb-2">Please fix the following errors:</h5>
                            <ul className="list-disc ml-6">
                                {formErrors.map((err, i) => <li key={i}>{err}</li>)}
                            </ul>
                        </div>
                    )}
                    {/* Submit Button */}
                    <div className="text-center mt-6">
                        {submitting ? (
                            <Loading />
                        ) : (
                            <button
                                className="bg-cornell-red text-white rounded-full px-6 py-3 font-semibold shadow transition-transform duration-200 hover:scale-103 disabled:opacity-50 cursor-pointer"
                                type="submit"
                                disabled={submitting}
                            >
                                {editMode ? "Edit Message" : "Submit Message"}
                            </button>
                        )}
                        <p className="mt-3 text-gray-500">Please ensure you get a confirmation message after submitting.</p>
                        <p className="mt-3 text-gray-500">Your message will be delivered on the last day of classes.</p>
                    </div>
                </form>
            </section>
        </main>
    );
}
