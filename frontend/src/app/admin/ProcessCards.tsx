import React, { useEffect, useState, useRef } from "react";

import Table, { TableHeader } from "@/components/Table";
import MessageGroupSelector from "@/components/MessageGroupSelector";

const tableHeaders: TableHeader[] = [
    { key: "message_group", label: "Message Group" },
    { key: "timestamp", label: "Timestamp" },
    { key: "csv", label: "Download CSV" },
    { key: "pptx", label: "Download PPTX" },
    { key: "pdf", label: "Download PDF" },
];

export default function ProcessCards() {
    const [messageGroup, setMessageGroup] = useState<string>("");
    const [processPptxPdf, setProcessPptxPdf] = useState<boolean>(false);
    const [processAlphabetical, setProcessAlphabetical] = useState<boolean>(false);
    const [processing, setProcessing] = useState<boolean>(false);
    const [status, setStatus] = useState<string>("");
    const [processedRows, setProcessedRows] = useState<any[]>([]);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Fetch processed cards table
    const fetchProcessStatus = async () => {
        try {
            const res = await fetch("/api/admin/get-process-status");
            if (!res.ok) throw new Error("Failed to fetch process status");
            const data = await res.json();
            // Expecting an array of objects
            const rows = Array.isArray(data) ? data : [];
            // Map to table row format
            const tableRows = rows.map(cardInfo => {
                // CSV
                let csvCell;
                if (cardInfo.done?.includes(".csv")) {
                    csvCell = (
                        <a href={`/api/admin/get-all-cards/${cardInfo.filename}.csv`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Download</a>
                    );
                } else if (cardInfo.to_process?.includes(".csv")) {
                    csvCell = <span>processing...</span>;
                } else {
                    csvCell = <span>-</span>;
                }
                // PPTX
                let pptxCell;
                if (cardInfo.done?.includes(".pptx")) {
                    pptxCell = (
                        <a href={`/api/admin/get-all-cards/${cardInfo.filename}.pptx`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Download</a>
                    );
                } else if (cardInfo.to_process?.includes(".pptx")) {
                    pptxCell = <span>processing... <span className="text-xs">{cardInfo.pptx_progress}</span></span>;
                } else {
                    pptxCell = <span>-</span>;
                }
                // PDF
                let pdfCell;
                if (cardInfo.done?.includes(".pdf")) {
                    pdfCell = (
                        <a href={`/api/admin/get-all-cards/${cardInfo.filename}.pdf`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Download</a>
                    );
                } else if (cardInfo.to_process?.includes(".pdf")) {
                    pdfCell = <span>processing...</span>;
                } else {
                    pdfCell = <span>-</span>;
                }
                return {
                    message_group: cardInfo.message_group,
                    timestamp: cardInfo.filename.split(' ').slice(1).join(' '),
                    csv: csvCell,
                    pptx: pptxCell,
                    pdf: pdfCell,
                    sortKey: cardInfo.timestamp || '',
                };
            });
            setProcessedRows(tableRows);
        } catch (err) {
            setStatus("Error loading processed cards");
        }
    };

    // Poll every 3 seconds
    useEffect(() => {
        fetchProcessStatus();
        intervalRef.current = setInterval(fetchProcessStatus, 3000);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    // Handle message group change
    function handleMessageGroupChange(selected: { key: string; label: string }) {
        setMessageGroup(selected.key);
    }

    // Process cards button
    async function handleProcessCards() {
        if (!messageGroup) {
            setStatus("Please select a message group.");
            return;
        }
        setProcessing(true);
        setStatus("Processing cards...");
        try {
            const res = await fetch(
                `/api/admin/process-all-cards/${messageGroup}?pptx-pdf=${processPptxPdf}&alphabetical=${processAlphabetical}`
            );
            if (!res.ok) {
                setStatus(`Error: ${res.status}`);
            } else {
                setStatus("Cards processed successfully!");
                fetchProcessStatus();
            }
        } catch (err) {
            setStatus("Error processing cards.");
        }
        setProcessing(false);
    }

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold">Download All Cards as CSV, PPTX, and PDF</h2>
            <p>
                Use this tool to download all cards for a specific message group in CSV, PPTX, and PDF formats. You can choose to process PPTX/PDF and sort alphabetically.
            </p>
            <p>
                Downloading as a PDF will be necessary for sending the cards to Cornell Print Services. In most cases, downloading the PDF is enough; however, you can also download a PPTX to later convert to PDF on your computer (this is useful if you want to use Apple's emojis instead of Microsoft's).
            </p>
            <p>
                <b>Important:</b> After clicking the "Process" button, DO NOT click it again!! Processing the PPTX/PDFs can take up to a few hours, depending on how many cards there are and how large/complex your PPTX template is. The PDF doesn't have a progress percent but will take a while. Please just be patient; it will complete eventually :)
            </p>
            <p>
                If this doesn't work for some reason, there is an alternative that is a bit more cumbersome, using CSVs and Google AppScript. Contact Reid for instructions on how to do this.
            </p>
            <div className="flex flex-col gap-4 max-w-xs">
                <MessageGroupSelector
                    dropdown
                    showNoneOption={false}
                    showAllTimeOption={false}
                    initialValue={messageGroup}
                    onChange={handleMessageGroupChange}
                    className="min-w-[200px]"
                />
                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={processPptxPdf}
                        onChange={e => setProcessPptxPdf(e.target.checked)}
                    />
                    Process PPTX/PDF
                </label>
                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={processAlphabetical}
                        onChange={e => setProcessAlphabetical(e.target.checked)}
                    />
                    Sort Alphabetically
                </label>
                <button
                    className="bg-cornell-blue text-white font-semibold px-4 py-2 rounded-lg shadow hover:bg-cornell-red transition"
                    disabled={processing}
                    onClick={handleProcessCards}
                >
                    {processing ? "Processing..." : `Process ${messageGroup ? messageGroup : "Cards"}`}
                </button>
            </div>
            <div className="text-cornell-red font-semibold">{status}</div>
            <div className="mt-4">
                <Table
                    headers={tableHeaders}
                    maxHeight={400}
                    data={processedRows}
                />
            </div>
        </div>
    );
}
