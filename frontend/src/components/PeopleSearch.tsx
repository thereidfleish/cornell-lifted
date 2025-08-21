import React, { useState, useEffect } from "react";
import Loading from "@/components/Loading";
import { useGlobal } from "@/utils/GlobalContext";

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
  const { user, config } = useGlobal();

  useEffect(() => {
    if (!searchInput) {
      setSearchResults([]);
      setSearchStatus("");
      return;
    }
    setLoadingSearch(true);
    const timer = setTimeout(() => {
      fetch(`/api/people-search?q=${encodeURIComponent(searchInput)}`)
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
  }, [searchInput]);

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
          {user?.user?.email === `${selectedPerson.NetID}@cornell.edu` && <span> - Wait, that's you! While you can technically send a Lifted message to yourself, we encourage you to also spread the love to those around you :)</span>}
          {statusMsg}
        </div>
      )}
      <div className="mt-2">
        {loadingSearch ? <Loading /> : (
          <>
            <div className="text-sm text-gray-700 mb-2">{searchStatus}</div>
            <div className="overflow-auto" style={{ borderRadius: "0.75rem", border: "1px solid #d1d5db" }}>
              <table className="rounded-lg" style={{display: "block", maxHeight: "350px", overflow: "auto" }}>
                <thead className="sticky top-0 bg-gray-100">
                  <tr>
                    <th className="p-2 text-left">NetID</th>
                    <th className="p-2 text-left">Name</th>
                    <th className="p-2 text-left">Affiliation</th>
                    <th className="p-2 text-left">College</th>
                    <th className="p-2 text-left">Department</th>
                    <th className="p-2 text-left">Title</th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.map((person, idx) => (
                    <tr
                      key={person.NetID}
                      className={`cursor-pointer transition-colors duration-150 ${selectedPerson?.NetID === person.NetID ? "bg-blue-200" : "hover:bg-blue-100"} border-b border-gray-200`}
                      onClick={() => onSelect(person)}
                    >
                      <td className="p-2">{person.NetID}</td>
                      <td className="p-2">{person.Name}</td>
                      <td className="p-2">{person["Primary Affiliation"]}</td>
                      <td className="p-2">{person.College}</td>
                      <td className="p-2">{person["Primary Dept"]}</td>
                      <td className="p-2">{person["Primary Title"]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
