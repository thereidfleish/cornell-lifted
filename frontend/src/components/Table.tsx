import React from "react";

export interface TableHeader {
  key: string;
  label: string;
}

export interface TableProps {
  headers: TableHeader[];
  data: Array<Record<string, React.ReactNode>>;
  className?: string;
  style?: React.CSSProperties;
}

const Table: React.FC<TableProps> = ({ headers, data, className = "", style }) => {
  return (
    <div className={`overflow-auto rounded-lg border border-gray-300 ${className}`} style={style}>
      <table className="w-full rounded-lg" style={{ display: "block", maxHeight: "350px", overflow: "auto" }}>
        <thead className="sticky top-0 bg-gray-100">
          <tr>
            {headers.map((header) => (
              <th key={header.key} className="p-2 text-left font-semibold text-gray-700">
                {header.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx} className="border-b border-gray-200">
              {headers.map((header) => (
                <td key={header.key} className="p-2 align-top">
                  {row[header.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
