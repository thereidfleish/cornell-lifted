import React, { useState, useEffect } from "react";
import { useGlobal } from "@/utils/GlobalContext";

type MessageGroupSelectorProps = {
    initialValue?: string;
    showNoneOption?: boolean;
    onChange?: (selected: { key: string; label: string }) => void;
    className?: string;
};

export default function MessageGroupSelector({ initialValue = "", showNoneOption = false, onChange, className = "" }: MessageGroupSelectorProps) {
    const { config } = useGlobal();
    const [selected, setSelected] = useState<string>(initialValue);

    console.log(config)

    // Build message group list in config file order
    const messageGroups: { key: string; label: string }[] = config?.message_group_list_map
        ? Object.entries(config.message_group_list_map).map(([key, label]) => ({ key, label }))
        : [];

    // Add 'none' option at the top if requested
    const options = showNoneOption
        ? [{ key: "none", label: "None" }, ...messageGroups]
        : messageGroups;

    useEffect(() => {
        // If initialValue changes, update selected
        setSelected(initialValue);
    }, [initialValue]);

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        setSelected(e.target.value);
        const found = options.find(opt => opt.key === e.target.value);
        if (onChange && found) {
            onChange({ key: found.key, label: found.label });
        }
    }

    return (
        <div className={className}>
            <fieldset
                className="space-y-2 border border-cornell-blue rounded-lg p-3"
                style={{ maxHeight: 200, overflowY: 'auto', width: 'fit-content' }}
            >
                {options.map(opt => (
                    <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="message-group"
                            value={opt.key}
                            checked={selected === opt.key}
                            onChange={handleChange}
                            className="accent-cornell-red"
                        />
                        <span className="text-gray-800">{opt.label}</span>
                    </label>
                ))}
            </fieldset>
        </div>
    );
}