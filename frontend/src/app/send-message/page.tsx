
"use client";

import SendMessageForm from "./SendMessageForm";
import { useGlobal } from "@/utils/GlobalContext";
import Loading from "@/components/Loading";

export default function SendMessagePage() {
    const { config } = useGlobal();

    if (!config) {
        return (
            <main className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center justify-center">
                    <Loading />
                </div>
            </main>
        );
    }

    if (config.form_message_group === "none") {
        return (
            <main className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-lg w-full text-center border border-gray-200">
                    <h2 className="text-2xl font-bold text-cornell-red mb-4">The message form isn't open right now</h2>
                    <p className="mb-6 text-gray-700">You can't send a Lifted message at this time. Please check back later!</p>
                    <div className="flex flex-col gap-3">
                        <a href="/faqs" className="bg-cornell-blue text-white rounded-full px-5 py-2 font-semibold shadow hover:bg-cornell-red transition">View FAQs</a>
                        <a href="/messages" className="bg-gray-100 text-cornell-blue rounded-full px-5 py-2 font-semibold shadow hover:bg-cornell-blue hover:text-white transition">View Your Sent Messages</a>
                    </div>
                </div>
            </main>
        );
    }
    return <SendMessageForm />;
}
