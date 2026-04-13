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