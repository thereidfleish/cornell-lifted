export type User = {
  authenticated: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    is_admin: boolean;
  };
} | null;

export type LiftedConfig = {
  message_group_list_map: {
    [key: string]: string;
  };
  hidden_cards: string[];
  form_message_group: string;
  attachment_message_group: string;
  swap_from: string;
  swap_to: string;
  swap_text: string;
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

export type LiftedHomepageStats = {
  total_received: number;
  unique_sent: number;
  unique_received: number;
};