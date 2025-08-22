import React from "react";

export interface TableHeader {
  key: string;
  label: string;
}

export interface TableProps {
  headers: TableHeader[];
  data: Array<Record<string, React.ReactNode>>;
  maxHeight: number;
  className?: string;
  style?: React.CSSProperties;
}

const Table: React.FC<TableProps> = ({ headers, data, maxHeight, className = "", style }) => {
  return (
    <div
      className={`rounded-lg border border-gray-300 ${className}`}
      style={{ ...style }}
    >
      <table
        className="w-full rounded-lg"
        style={{ display: "block", maxHeight: maxHeight, minWidth: "1000px", overflow: "auto" }}
      >
        <thead className="sticky top-0 bg-gray-100">
          <tr>
            {headers.map((header) => (
              <th
                key={header.key}
                className="p-2 text-left font-semibold text-gray-700"
                style={{ maxWidth: 300, wordBreak: "break-word", whiteSpace: "normal" }}
              >
                {header.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx} className="border-b border-gray-200">
              {headers.map((header) => {
                const cell = row[header.key];
                const maxWidth = typeof cell === "string" && cell.length < 100 ? 100 : 300;
                return (
                  <td
                    key={header.key}
                    className="p-2 align-top"
                    style={{ maxWidth, wordBreak: "break-word", whiteSpace: "normal" }}
                  >
                    {cell}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
