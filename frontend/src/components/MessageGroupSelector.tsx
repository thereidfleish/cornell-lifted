import React, { useState, useEffect } from "react";
import { useGlobal } from "@/utils/GlobalContext";

type MessageGroupSelectorProps = {
    initialValue?: string;
    showNoneOption?: boolean;
    showAllTimeOption?: boolean;
    onChange?: (selected: { key: string; label: string }) => void;
    className?: string;
    dropdown?: boolean;
};

export default function MessageGroupSelector({ initialValue = "", showNoneOption = false, showAllTimeOption = false, onChange, className = "", dropdown = false }: MessageGroupSelectorProps) {
    const { config } = useGlobal();
    const [selected, setSelected] = useState<string>(initialValue);

    console.log(config)

    // Build message group list in config file order
    let messageGroups: { key: string; label: string }[] = config?.message_group_list_map
        ? Object.entries(config.message_group_list_map).map(([key, label]) => ({ key, label }))
        : [];

    // Add 'all time' option at the bottom if requested
    if (showAllTimeOption) {
        messageGroups = [...messageGroups, { key: "all", label: "All Time" }];
    }

    // Add 'none' option at the top if requested
    const options = showNoneOption
        ? [{ key: "none", label: "None" }, ...messageGroups]
        : messageGroups;

    useEffect(() => {
        // If initialValue changes, update selected
        setSelected(initialValue);
    }, [initialValue]);

    // If initialValue is empty, select first available option and notify parent
    useEffect(() => {
        if (!initialValue && options.length > 0) {
            setSelected(options[0].key);
            if (onChange) {
                onChange({ key: options[0].key, label: options[0].label });
            }
        }
    }, [initialValue, options, onChange]);

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
        setSelected(e.target.value);
        const found = options.find(opt => opt.key === e.target.value);
        if (onChange && found) {
            onChange({ key: found.key, label: found.label });
        }
    }

    return (
        <div className={className}>
            {dropdown ? (
                <select
                    className="border border-cornell-blue rounded-lg p-3 bg-white text-gray-800"
                    value={selected}
                    onChange={handleChange}
                    style={{ maxHeight: 200, width: 'fit-content' }}
                >
                    {options.map(opt => (
                        <option key={opt.key} value={opt.key}>{opt.label}</option>
                    ))}
                </select>
            ) : (
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
            )}
        </div>
    );
}