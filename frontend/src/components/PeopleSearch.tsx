import React, { useState, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import { themeQuartz, ColDef } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import Loading from "@/components/Loading";
import { useGlobal } from "@/utils/GlobalContext";

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

export interface Person {
  NetID: string;
  Name: string;
  "Primary Affiliation": string;
  College: string;
  "Primary Dept": string;
  "Primary Title": string;
}

export interface PeopleSearchProps {
  onSelect: (person: Person) => void;
  selectedPerson?: Person | null;
}

export default function PeopleSearch({ onSelect, selectedPerson }: PeopleSearchProps) {
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState<Person[]>([]);
  const [searchStatus, setSearchStatus] = useState<string>("");
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [easterEgg, setEasterEgg] = useState<string>("");
  const [expandedSearch, setExpandedSearch] = useState(false);
  const { user, config } = useGlobal();

  useEffect(() => {
    if (!searchInput) {
      setSearchResults([]);
      setSearchStatus("");
      return;
    }
    setLoadingSearch(true);
    const timer = setTimeout(() => {
      const expandParam = expandedSearch ? '&expand_search=true' : '';
      fetch(`/api/people-search?q=${encodeURIComponent(searchInput)}${expandParam}`)
        .then((res) => res.json())
        .then((data) => {
          setLoadingSearch(false);
          if (data.results === "none") {
            setSearchResults([]);
            setSearchStatus("No results found. Check your spelling or try typing in the exact NetID. If you'd like to send a message to a non-NetID, such as touchdown@cornell.edu, please email us at lifted@cornell.edu and we'll send your message!");
          } else {
            setSearchResults(data.results);
            setSearchStatus(`${data.results.length} result(s) found. Select a person below.`);
          }
        })
        .catch(() => {
          setLoadingSearch(false);
          setSearchStatus("There was an error. Try refreshing the page or try again later. Please report this to lifted@cornell.edu!!");
        });
    }, 700);
    return () => clearTimeout(timer);
  }, [searchInput, expandedSearch]);

  useEffect(() => {
    async function fetchEasterEgg() {
      if (selectedPerson?.NetID) {
        try {
          const res = await fetch(`/api/easter-egg/${selectedPerson.NetID}`);
          if (res.ok) {
            const data = await res.json();
            setEasterEgg(data.result || "");
          } else {
            setEasterEgg("");
          }
        } catch {
          setEasterEgg("");
        }
      } else {
        setEasterEgg("");
      }
    }
    fetchEasterEgg();
  }, [selectedPerson]);

  // AG Grid column definitions
  const columnDefs: ColDef<Person>[] = [
    { headerName: "NetID", field: "NetID", width: 90 },
    { headerName: "Name", field: "Name", width: 200 },
    { headerName: "Affiliation", field: "Primary Affiliation", width: 120 },
    { headerName: "College", field: "College", width: 150 },
    { headerName: "Department", field: "Primary Dept", width: 200 },
    { headerName: "Title", field: "Primary Title", width: 200 }
  ];

  const handleRowSelection = (event: any) => {
    const selectedRows = event.api.getSelectedRows();
    if (selectedRows.length > 0) {
      onSelect(selectedRows[0]);
    }
  };

  // Calculate dynamic height based on number of rows
  const getGridHeight = () => {
    const headerHeight = 40; // Height of header row
    const rowHeight = 42; // Approximate height per row
    const padding = 10; // Some padding
    const calculatedHeight = headerHeight + (searchResults.length * rowHeight) + padding;
    return Math.min(calculatedHeight, 300); // Max height of 300px
  };

  // Allowed affiliations
  const goodAffiliations = ["student", "faculty", "staff", "academic", "temporary"];
  let statusBg = "bg-green-50 text-green-900 border border-green-200";
  let statusMsg = "";
  if (selectedPerson) {
    const affiliation = selectedPerson["Primary Affiliation"]?.toLowerCase();
    if (!goodAffiliations.includes(affiliation)) {
      statusBg = "bg-yellow-50 text-yellow-900 border border-yellow-200";
      statusMsg = ` This person is a(n) ${selectedPerson["Primary Affiliation"]}. Are you sure you selected the correct person?`;
    }
  }
  return (
    <div>
      <label className="block font-bold text-cornell-blue mb-1">🔍 Select Recipient</label>
      <input
        type="text"
        className="form-control w-full rounded-lg border border-gray-300 p-3 mb-2"
        placeholder="Search by name or NetID..."
        value={searchInput}
        onChange={e => setSearchInput(e.target.value)}
      />
      <p className="text-sm text-gray-500">Search for a name or NetID above, then select it in the table below.</p>
      {selectedPerson && (
        <div className={`mt-3 p-2 rounded text-sm ${statusBg}`}>
          Selected: <b>{selectedPerson.NetID}</b> ({selectedPerson.Name}, {selectedPerson["Primary Affiliation"]}) {easterEgg}
          {user?.user?.email === `${selectedPerson.NetID}@cornell.edu` && <span> - Wait, that's you! While you can <i>technically</i> send a Lifted message to yourself, we encourage you to also spread the love to those around you :)</span>}
          {statusMsg}
        </div>
      )}
      <div className="mt-2">
        {loadingSearch ? <Loading /> : (
          <>
            <div className="text-sm text-gray-700 mb-2">{searchStatus}</div>
            {searchResults.length === 0 && searchInput && !loadingSearch && !expandedSearch && (
              <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <p className="text-blue-900 mb-3">Looking to send to an alumnus or someone else?</p>
                <button
                  type="button"
                  className="bg-cornell-blue text-white rounded-full px-5 py-2 font-semibold shadow hover:bg-cornell-red transition"
                  onClick={() => setExpandedSearch(true)}
                >
                  Expand Search
                </button>
              </div>
            )}
            {searchResults.length > 0 && (
              <div className="ag-theme-quartz" style={{ height: `${getGridHeight()}px`, width: '100%' }}>
                <AgGridReact
                  rowData={searchResults}
                  columnDefs={columnDefs}
                  theme={themeQuartz}
                  rowSelection="single"
                  onSelectionChanged={handleRowSelection}
                  suppressCellFocus={true}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
