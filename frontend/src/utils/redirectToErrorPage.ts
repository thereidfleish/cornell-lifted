// Utility to redirect to /error with error JSON fields as query params
export function redirectToErrorPage(errorJson: any) {
  if (typeof window !== "undefined") {
    const params = new URLSearchParams();
    if (errorJson.error_code) params.set("error_code", errorJson.error_code);
    if (errorJson.error_message_title) params.set("error_message_title", errorJson.error_message_title);
    if (errorJson.error_message_body) params.set("error_message_body", errorJson.error_message_body);
    if (errorJson.error_message_human_body) params.set("error_message_human_body", errorJson.error_message_human_body);
    window.location.href = `/error?${params.toString()}`;
  }
}
