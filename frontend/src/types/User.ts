export type User = {
  authenticated: boolean;
  impersonating: boolean;
  user?: {
    id: string;
    email: string;
    given_name: string;
    full_name: string;
    is_admin: boolean;
    admin_write_perm: boolean;
  };
} | null;

export type LiftedConfig = {
  theme: string;
  auto_swap_if_pref_exists?: boolean;
  message_group_list_map: {
    [key: string]: string;
  };
  hidden_cards: string[];
  coming_soon_text_p: string;
  homepage_event_date_text: string;
  homepage_form_open_text: string;
  form_message_group: string;
  attachment_message_group: string;
  swapping: {
    from: string;
    to: string;
    enabled: boolean;
    text: string;
    title: string;
    button_text: string;
    deadline: string;
    dialog_text: string;
  }[];
  attachment_text: string;
  attachment_deadline: string;
  rich_text_types: {
    form: string;
    sender: string;
    recipient: string;
  };
  admin_tabs: {
    lifted_config: string;
    message_tools: string;
    advanced: string;
  };
} | null;

export type CardData = {
    id: number;
    created_timestamp: string;
    message_group: string;
    sender_email: string;
    sender_name: string;
    recipient_email: string;
    recipient_name: string;
    message_content: string;
    attachment: string | null;
}

export type LiftedHomepageStats = {
  total_received: number;
  unique_sent: number;
  unique_received: number;
};

