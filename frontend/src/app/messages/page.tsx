"use client"
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { useGlobal } from "@/utils/GlobalContext";
import Loading from "@/components/Loading";
import SentReceivedCard from "@/components/messages/SentReceivedCard";

export type Attachment = {
    id: number;
    attachment_name: string;
    attachment_count: number | null;
};

// Lifted event type and its details.  Either "physical" or "eLifted"
export type LiftedEventTypeDetails = {
    message_group: string;
    type: string;
    type_name: string;
    hide_cards: boolean;
    received_count: number;
    sent_count: number;
    received_card_ids: number[];
    sent_card_ids: number[];
    received_rank: number | null;
    sent_rank: number | null;
    available_attachments: Attachment[] | null;
    chosen_attachment: Attachment | null;
};

// Lifted event.  Think of this event as an iteration, once per semester
export type LiftedEvent = {
    year: string;
    year_name: string;
    season: string;
    season_name: string;
    types: LiftedEventTypeDetails[];
};

export default function MessagesPage() {
    const { user, config, loading } = useGlobal();
    const [showOlder, setShowOlder] = useState(false);
    const [messagesData, setMessagesData] = useState<LiftedEvent[]>([]);
    const [messagesLoading, setMessagesLoading] = useState(true);

    console.log("User from context:", user);

    useEffect(() => {
        if (!user?.authenticated) return;
        setMessagesLoading(true);
        fetch("/api/messages")
            .then((res) => res.json())
            .then((data) => {
                console.log("/api/messages output:", data);
                setMessagesData(data);
                setMessagesLoading(false);
            })
            .catch((err) => {
                console.error("Error fetching /api/messages:", err);
                setMessagesLoading(false);
            });
    }, [user?.authenticated]);

    return (
        <main className="bg-[#f4fbf3] font-tenor px-4">
            {/* Hero Section */}
            <section className="relative pt-16 flex flex-col items-center">
                <div className="flex flex-col items-center">
                    <img
                        src="../images/logo.png"
                        width={250}
                        alt="Cornell Lifted Logo"
                        className="mx-auto mb-8 transition-transform duration-300 hover:scale-105"
                    />
                    <h2 className="text-cornell-red font-schoolbell text-4xl mb-2 font-bold text-center">Your Lifted Journey</h2>
                    <p className="text-lg text-center text-gray-700 mb-6">Explore the gratitude you've shared and received throughout your Cornell experience</p>
                </div>
            </section>

            {/* Auth Section */}
            {loading ? <Loading /> : !user?.authenticated ? (
                <section className="pb-12 pt-6">
                    <div className="max-w-xl mx-auto bg-white rounded-xl shadow p-8 text-center">
                        <div className="text-4xl mb-4">🔑</div>
                        <h4 className="text-2xl font-bold text-cornell-blue mb-2">Sign In to View Your Messages</h4>
                        <p className="mb-4">Sign in with your Cornell NetID to view and manage Lifted messages you've sent and received!</p>
                        <a href="https://api.cornelllifted.com/login?next=/messages" className="bg-cornell-red text-white rounded-full px-6 py-3 font-semibold shadow inline-block">Sign In with Cornell NetID</a>
                    </div>
                </section>
            ) : messagesLoading ? (
                <Loading />
            ) : (
                <section id="messages-dashboard" className="py-8">
                    <div className="max-w-6xl mx-auto">
                        {/* User greeting */}
                        <div className="bg-white rounded-xl shadow-lg flex flex-col md:flex-row items-center justify-between mb-6 p-6">
                            <div>
                                <h3 className="text-3xl text-cornell-red font-schoolbell mb-1">Welcome, {user?.user?.name}!</h3>
                                <p className="text-gray-700">You are signed in as {user?.user?.email}</p>
                            </div>
                            <a href="/send-message" className="bg-cornell-red text-white rounded-full px-6 py-3 font-semibold shadow hover:bg-cornell-blue transition mt-4 md:mt-0">Send a New Message</a>
                        </div>
                        <h2 className="text-3xl mb-4">Your Lifted Timeline</h2>
                        {/* Timeline */}
                        <div className="space-y-8">
                            {messagesData.map((event, i) => (
                                <div key={event.year_name + event.season} className={`${i > 2 && !showOlder ? 'hidden' : ''}`}>
                                    <h2 className="text-3xl text-cornell-blue mb-4">{event.season_name + " " + event.year_name} Lifted</h2>
                                    <div className="w-14 h-1 bg-cornell-red mb-4 rounded" style={{ borderBottom: "2px solid #b31b1b" }}></div>
                                    <div className="flex flex-col lg:flex-row lg:gap-6">
                                        {event.types.map((typeDetails, idx) => (
                                            <div key={typeDetails.type} className="flex-1">
                                                <SentReceivedCard
                                                    details={typeDetails}
                                                    year_name={event.year_name}
                                                    season_name={event.season_name}
                                                    latest_physical_event={i === 0 && typeDetails.type === "p"}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {/* Toggle older semesters */}
                        {messagesData.length > 3 && (
                            <button className="mt-6 flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-full text-cornell-blue font-semibold hover:bg-cornell-blue hover:text-white transition" onClick={() => setShowOlder((v) => !v)}>
                                <span className="text-xl">{showOlder ? '▲' : '▼'}</span>
                                <span>{showOlder ? 'Hide Older Lifted Memories' : 'View Older Lifted Memories'}</span>
                                <span className="bg-cornell-red text-white rounded-full px-2 ml-2 text-sm">{messagesData.length - 3}</span>
                            </button>
                        )}
                        {/* Legacy archive */}
                        <div className="mt-8 bg-gray-50 rounded-xl p-6">
                            <h3 className="text-cornell-blue text-xl font-bold mb-2">Legacy Lifted Messages</h3>
                            <div className="flex items-center gap-4">
                                <span className="text-3xl">📚</span>
                                <div>
                                    <h5 className="font-bold mb-1">Spring 2017 and Spring 2016</h5>
                                    <p>Please send us an email to access your messages from Spring 2017 and Spring 2016. We'll try our best to find them!</p>
                                    <a href="mailto:lifted@cornell.edu" className="btn btn-outline-primary btn-sm mt-2 border border-cornell-blue text-cornell-blue rounded px-3 py-1 hover:bg-cornell-blue hover:text-white transition inline-block">Contact Us</a>
                                </div>
                            </div>
                        </div>
                        {/* Help Section */}
                        <div className="mt-8 bg-white rounded-xl shadow p-6">
                            <h3 className="text-cornell-blue text-xl font-bold mb-2">Missing messages?</h3>
                            <p>If you think you're missing a message, send us an email at <a href="mailto:lifted@cornell.edu" className="text-cornell-red underline">lifted@cornell.edu</a> and we'll help you find your messages!</p>
                            <p className="mb-0">If you received a message to a non-NetID email (such as touchdown@cornell.edu or i.love.lifted@gmail.com), you won't see it here. Send us an email and we'll find your message!</p>
                        </div>
                    </div>
                </section>
            )}
        </main>
    );
}
