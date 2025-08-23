import { LiftedEventTypeDetails } from "@/app/messages/page";
import MessageModal from "@/components/messages/MessageModal";
import React, { useState } from "react";
import { useGlobal } from "@/utils/GlobalContext";
import ChooseAttachment from "./ChooseAttachment";
import SwapCards from "./SwapCards";

type SentReceivedCardProps = {
    details: LiftedEventTypeDetails;
    year_name: string;
    season_name: string;
    latest_physical_event: boolean
};

export default function SentReceivedCard({ details, year_name, season_name, latest_physical_event }: SentReceivedCardProps) {
    const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedCardId, setSelectedCardId] = useState<number | string | null>(null);
    const [overrideHiddenMessage, setOverrideHiddenMessage] = useState(false);
    const { config } = useGlobal();

    const isELifted = details.type === "e";
    const isPhysical = details.type === "p";

    const handleCardClick = (cardId: number | string, overrideHiddenMessage: boolean) => {
        setSelectedCardId(cardId);
        setOverrideHiddenMessage(overrideHiddenMessage);
        setModalOpen(true);
    };
    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedCardId(null);
        setOverrideHiddenMessage(false);
    };

    return (
        <div className="bg-white rounded-xl shadow-lg mb-4 overflow-hidden">
            <div className="bg-[#0076BD]/5 border-b-2 border-[#0076BD]/10 p-4">
                <h4 className={`font-bold text-xl ${isELifted ? 'text-cornell-red' : 'text-cornell-blue'}`}>{season_name} {year_name} {details.type_name}</h4>
            </div>
            <div>
                <div className="p-4">
                    <ul className="mb-3 flex gap-2" role="tablist">
                        <li role="presentation">
                            <button
                                className={`px-4 py-2 rounded-3xl cursor-pointer transition-colors duration-200 ${activeTab === 'received' ? 'bg-cornell-blue text-white' : 'hover:bg-gray-100'}`}
                                onClick={() => setActiveTab('received')}
                                type="button"
                                role="tab"
                                aria-selected={activeTab === 'received'}
                            >
                                Received
                                {details.received_count > 0 && (
                                    <span className="ml-2 py-1 px-2 bg-blue-100 text-black font-bold rounded-full text-xs">{details.received_count}</span>
                                )}
                            </button>
                        </li>
                        <li role="presentation">
                            <button
                                className={`px-4 py-2 rounded-3xl cursor-pointer transition-colors duration-200 ${activeTab === 'sent' ? 'bg-cornell-blue text-white' : 'hover:bg-gray-100'}`}
                                onClick={() => setActiveTab('sent')}
                                type="button"
                                role="tab"
                                aria-selected={activeTab === 'sent'}
                            >
                                Sent
                                {details.sent_count > 0 && (
                                    <span className="ml-2 py-1 px-2 bg-blue-100 text-black font-bold rounded-full text-xs">{details.sent_count}</span>
                                )}
                            </button>
                        </li>
                    </ul>
                    <div className="mt-4">
                        {/* Received Tab */}
                        {activeTab === 'received' && (
                            <div role="tabpanel">
                                {details.received_count === 0 ? (
                                    <div className="text-gray-500 text-center py-4">
                                        <p>You did not receive any {isELifted ? 'e' : 'physical '}Lifted messages.</p>
                                    </div>
                                ) : (
                                    <>
                                        {details.received_rank !== null && details.received_rank <= 3 && (
                                            <div className="mb-3 p-1 px-2 flex items-center gap-2 text-sm bg-yellow-100/75 rounded-2xl border border-yellow-200">
                                                <span className="text-xl">🏆</span>
                                                You received the <strong>
                                                    {details.received_rank}
                                                    {details.received_rank === 1 ? 'st' : details.received_rank === 2 ? 'nd' : details.received_rank === 3 ? 'rd' : 'th'}
                                                </strong> most messages out of all Cornellians!
                                            </div>
                                        )}
                                        {details.hide_cards ? (
                                            <div className="text-center p-2">
                                                {isPhysical ? (
                                                    latest_physical_event ? (
                                                        <div className="shadow-lg rounded-lg p-4 transition-all duration-500 ease-in-out scale-100 hover:scale-102">
                                                            <h2 className="text-3xl text-cornell-red font-schoolbell mb-4">🎈 Coming Soon!</h2>
                                                            <p className="text-sm text-gray-800 mb-4">Pick up your {details.received_count} physical card{details.received_count !== 1 ? 's' : ''} on the <b>Arts Quad before 7 PM</b> on the last day of classes <b>(Tuesday, May 6th)!</b></p>
                                                            {details.chosen_attachment && (
                                                                <p className="text-sm text-gray-800 mb-4">You'll also receive a <b>{details.chosen_attachment?.attachment_name}</b> alongside your cards!</p>
                                                            )}
                                                            <p className="text-sm text-gray-500">Keep an eye on your email for details!</p>
                                                        </div>
                                                    ) : (
                                                        <div className="shadow-lg rounded-lg p-4 transition-all duration-500 ease-in-out scale-100 hover:scale-102">
                                                            <h1 className="text-4xl">🎈</h1>
                                                            <h2 className="text-3xl text-cornell-red font-schoolbell mb-4">We hope you enjoyed Lifted!</h2>
                                                            <p className="text-sm text-gray-500">Since you received physical cards, you can't view them here</p>
                                                        </div>
                                                    )
                                                ) : (
                                                    <div className="shadow-lg rounded-lg p-4 transition-all duration-500 ease-in-out scale-100 hover:scale-102">
                                                        <h2 className="text-3xl text-cornell-red font-schoolbell mb-4">💌 Coming Soon!</h2>
                                                        <p className="text-sm text-gray-800 mb-4">Your {details.received_count} eLifted message{details.received_count !== 1 ? 's' : ''} will be available here on the last day of classes!</p>
                                                    </div>
                                                )}
                                                {details.message_group === config?.attachment_message_group && (
                                                    <div className="shadow-lg rounded-lg p-4 mt-4 border border-dashed border-blue-200">
                                                        <ChooseAttachment message_group={details.message_group} />
                                                    </div>
                                                )}
                                                {details.message_group === config?.swap_from && (
                                                    <div className="shadow-lg rounded-lg p-4 mt-4 border border-dashed border-blue-200">
                                                        <SwapCards />
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-4 gap-8 p-2">
                                                {details.received_card_ids.map((id: number, idx: number) => (
                                                    <button
                                                        key={id}
                                                        type="button"
                                                        className="bg-white rounded-lg shadow inset-shadow-2xs p-3 flex flex-col items-center hover:scale-105 transition relative cursor-pointer"
                                                        onClick={() => handleCardClick(id, !details.hide_cards)}
                                                    >
                                                        <div className="flex flex-col items-center">
                                                            <div className="text-3xl mb-2">💌</div>
                                                            <span className="relative">
                                                                <span
                                                                    className="absolute left-1/2 -bottom-6 -translate-x-1/2 w-6 h-6 bg-cornell-red rounded-full flex items-center justify-center text-white text-xs font-bold"
                                                                    style={{ zIndex: 1 }}
                                                                >
                                                                    {idx + 1}
                                                                </span>
                                                            </span>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                        {/* Sent Tab */}
                        {activeTab === 'sent' && (
                            <div role="tabpanel">
                                {details.sent_count === 0 ? (
                                    <div className="text-gray-500 text-center py-4">
                                        <p>You did not send any {isELifted ? 'e' : 'physical '}Lifted messages.</p>
                                    </div>
                                ) : (
                                    <>
                                        {details.sent_rank !== null && details.sent_rank <= 3 && (
                                            <div className="mb-3 p-1 px-2 flex items-center gap-2 text-sm bg-yellow-100/75 rounded-2xl border border-yellow-200">
                                                <span className="text-xl">🏆</span>
                                                You sent the <strong>
                                                    {details.sent_rank}
                                                    {details.sent_rank === 1 ? 'st' : details.sent_rank === 2 ? 'nd' : details.sent_rank === 3 ? 'rd' : 'th'}
                                                </strong> most messages out of all Cornellians!
                                            </div>
                                        )}
                                        {isELifted && (
                                            <p className="text-sm text-gray-500 mb-2">If a physical card you sent ends up here, it's because your recipient requested their physical cards to be delivered virtually instead. See <a href="/faqs" className="text-cornell-blue underline">FAQs</a>.</p>
                                        )}
                                        <div className="grid grid-cols-4 gap-8 p-2">
                                            {details.sent_card_ids.map((id: number, idx: number) => (
                                                <button
                                                    key={id}
                                                    type="button"
                                                    className="bg-white rounded-lg shadow inset-shadow-2xs p-3 flex flex-col items-center hover:scale-105 transition relative cursor-pointer"
                                                    onClick={() => handleCardClick(id, !details.hide_cards)}
                                                >
                                                    <div className="flex flex-col items-center">
                                                        <div className="text-3xl mb-2">💌</div>
                                                        <span className="relative">
                                                            <span
                                                                className="absolute left-1/2 -bottom-6 -translate-x-1/2 w-6 h-6 bg-cornell-red rounded-full flex items-center justify-center text-white text-xs font-bold"
                                                                style={{ zIndex: 1 }}
                                                            >
                                                                {idx + 1}
                                                            </span>
                                                        </span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                    {/* Message Modal */}
                    <MessageModal
                        cardId={selectedCardId}
                        open={modalOpen}
                        onClose={handleCloseModal}
                        overrideHiddenMessage={overrideHiddenMessage}
                    />
                </div>
            </div>
        </div>
    );
}