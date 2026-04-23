"use client"
import React, { useEffect, useState } from "react";
import { useGlobal } from "@/utils/GlobalContext";
import useAdminReadOnly from "./useAdminReadOnly";

export default function OtherSection() {
  const { config, refreshConfig } = useGlobal() as any;
  const isReadOnlyAdmin = useAdminReadOnly();
  const [comingSoonTextP, setComingSoonTextP] = useState(config?.coming_soon_text_p || "");
  const [homepageEventDateText, setHomepageEventDateText] = useState(config?.homepage_event_date_text || "");
  const [homepageFormOpenText, setHomepageFormOpenText] = useState(config?.homepage_form_open_text || "");
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    setComingSoonTextP(config?.coming_soon_text_p || "");
    setHomepageEventDateText(config?.homepage_event_date_text || "");
    setHomepageFormOpenText(config?.homepage_form_open_text || "");
  }, [config]);

  async function handleSaveOtherTexts(e: React.FormEvent) {
    e.preventDefault();
    const response = await fetch("/api/admin/update-other-texts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        coming_soon_text_p: comingSoonTextP,
        homepage_event_date_text: homepageEventDateText,
        homepage_form_open_text: homepageFormOpenText,
      }),
    });
    const data = await response.json().catch(() => ({}));
    setStatusMsg(data.status || (response.ok ? "Other text settings updated!" : "Failed to update other text settings"));
    refreshConfig();
  }

  useEffect(() => {
    if (!statusMsg) return;
    const timer = setTimeout(() => setStatusMsg(""), 2000);
    return () => clearTimeout(timer);
  }, [statusMsg]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Other</h2>
      <p className="text-gray-700">
        Edit homepage copy and the physical Coming Soon card text from one place.
      </p>

      <form onSubmit={handleSaveOtherTexts} className="space-y-6 max-w-3xl">
        <div className="space-y-2">
          <label className="font-semibold block" htmlFor="coming-soon-text-p">Coming Soon Text</label>
          <p className="text-sm text-gray-600">
            This text appears below the dynamic "Pick up your &lt;count&gt; physical card(s)." line on the physical Coming Soon card.
          </p>
          <textarea
            id="coming-soon-text-p"
            value={comingSoonTextP}
            onChange={(e) => setComingSoonTextP(e.target.value)}
            className="border rounded p-2 w-full min-h-[88px]"
            disabled={isReadOnlyAdmin}
          />
        </div>

        <div className="space-y-2">
          <label className="font-semibold block" htmlFor="homepage-event-date-text">Homepage Event Date Text</label>
          <p className="text-sm text-gray-600">
            This replaces the date/location line on the homepage hero.
          </p>
          <input
            id="homepage-event-date-text"
            type="text"
            value={homepageEventDateText}
            onChange={(e) => setHomepageEventDateText(e.target.value)}
            className="border rounded p-2 w-full max-w-2xl"
            disabled={isReadOnlyAdmin}
          />
        </div>

        <div className="space-y-2">
          <label className="font-semibold block" htmlFor="homepage-form-open-text">Homepage Form Open Text</label>
          <p className="text-sm text-gray-600">
            This text shows on the homepage when the form is open. HTML tags are allowed.
          </p>
          <textarea
            id="homepage-form-open-text"
            value={homepageFormOpenText}
            onChange={(e) => setHomepageFormOpenText(e.target.value)}
            className="border rounded p-2 w-full min-h-[112px]"
            disabled={isReadOnlyAdmin}
          />
        </div>

        <button
          type="submit"
          className="bg-cornell-blue text-white font-semibold px-4 py-2 rounded-lg shadow hover:bg-cornell-red transition w-fit disabled:opacity-50"
          disabled={isReadOnlyAdmin}
        >
          Save Other Settings
        </button>
      </form>

      {statusMsg && <div className="text-green-700 font-semibold">{statusMsg}</div>}
    </div>
  );
}