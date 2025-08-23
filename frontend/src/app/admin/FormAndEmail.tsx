import React, { useState } from "react";
import MessageGroupSelector from "@/components/MessageGroupSelector";
import RichTextEditor from "@/components/RichTextEditor";
import { useGlobal } from "@/utils/GlobalContext";

export default function FormAndEmail() {
  const { config, refreshConfig } = useGlobal() as any;
  const [selected, setSelected] = useState<string>(config?.form_message_group || "none");
  const [statusMsg, setStatusMsg] = useState<string>("");

  async function handleChange(option: { key: string; label: string }) {
    setSelected(option.key);
    const formData = new FormData();
    formData.append("form-message-group", option.key);
    const res = await fetch("/api/admin/update-form-message-group", {
      method: "POST",
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    setStatusMsg(data.status || "Form message group updated!");
    refreshConfig();
  }

  React.useEffect(() => {
    if (statusMsg) {
      const timer = setTimeout(() => setStatusMsg("") , 2000);
      return () => clearTimeout(timer);
    }
  }, [statusMsg]);

  // For rich text editors
  const [rtMessageGroup, setRTMessageGroup] = useState<string>(selected);

  return (
    <div className="space-y-8">
      {/* Form Options Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Form Options</h2>
        <p>This is the message group that the form will be actively accepting submissions for. Usually, you will first set this to the physical version, and then switch to the eLifted version once you decide to end the physical form.</p>
        <p>Set this to <b>None</b> to close the form entirely.</p>
        {statusMsg && (
          <div className="text-green-700 font-semibold mb-2">{statusMsg}</div>
        )}
        <MessageGroupSelector
          initialValue={selected}
          showNoneOption={true}
          onChange={handleChange}
          className="max-w-md"
        />
      </div>

      {/* Form and Email Text Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Form and Email Text</h2>
        <p>Configure the rich text for the form description and the "You've Been Lifted" email for a specific message group. Use the dropdown below to select which message group to edit.</p>
        <MessageGroupSelector
          initialValue={rtMessageGroup}
          showNoneOption={false}
          onChange={opt => setRTMessageGroup(opt.key)}
          className="max-w-md"
          dropdown={true}
        />
        <div className="flex flex-col gap-8">
          <div>
            <h3 className="font-semibold mb-2">Form Description</h3>
            <p className="text-sm mb-2">This is the description text shown at the top of the form for the selected message group.</p>
            <div className="border rounded p-2 bg-white">
              <React.Suspense fallback={<div>Loading editor...</div>}>
                <RichTextEditor messageGroup={rtMessageGroup} type="form" />
              </React.Suspense>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2">You've Been Lifted Email</h3>
            <p className="text-sm mb-2">This is the email text sent to recipients when they are Lifted for the selected message group.</p>
            <div className="border rounded p-2 bg-white">
              <React.Suspense fallback={<div>Loading editor...</div>}>
                <RichTextEditor messageGroup={rtMessageGroup} type="recipient" />
              </React.Suspense>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
