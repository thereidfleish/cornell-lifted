import React from "react";

interface FormattedTimestampProps {
  timestamp: string | number | Date | null | undefined;
}

export function formatEasternTimestamp(timestamp: string | number | Date | null | undefined): string {
  const rawTimestamp = timestamp == null ? "" : String(timestamp);
  if (!timestamp) return rawTimestamp;
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) return rawTimestamp;

  const datePart = parsed.toLocaleDateString("en-US", {
    timeZone: "America/New_York",
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
  const timePart = parsed.toLocaleTimeString("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return `${datePart} at ${timePart}`;
}

const FormattedTimestamp: React.FC<FormattedTimestampProps> = ({ timestamp }) => {
  const formatted = formatEasternTimestamp(timestamp);
  return <>{formatted}</>;
};

export default FormattedTimestamp;