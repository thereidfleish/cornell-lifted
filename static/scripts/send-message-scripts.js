async function handlePeopleSearchQuery(inputText, my_netid) {
    queryStatus = document.getElementById("query-status")
    queryStatus.textContent = "Loading..."

    // Send a request to the Flask backend
    const response = await fetch(`/people-search?q=${encodeURIComponent(inputText)}`);
    if (!response.ok) {
        queryStatus.textContent = `There was an error ${response.status}.  Try refreshing the page or try again later.  Please report this to lifted@cornell.edu!!`
        return
    }
    const data = await response.json();

    // Update the table with the results
    const resultsTable = document.getElementById("people-info-table");
    const tableBody = resultsTable.querySelector("tbody");
    tableBody.innerHTML = ""; // Clear previous results

    if (data.results == "none") {
        queryStatus.textContent = "No results found.  Check your spelling or try typing in the exact NetID.  If you'd like to send a message to a non-NetID, such as touchdown@cornell.edu, please email us at lifted@cornell.edu and we'll send your message!"
        return
    }

    // Populate the table with new data
    data.results.forEach(result => {
        const row = document.createElement("tr");
        row.className = "table_hover"
        row.innerHTML = `<td>${result.NetID}</td><td>${result.Name}</td><td>${result["Primary Affiliation"]}</td><td>${result["College"]}</td><td>${result["Primary Dept"]}</td><td>${result["Primary Title"]}</td>`;

        row.addEventListener("click", () => selectPerson(row, result, my_netid));
        tableBody.appendChild(row);
    });

    document.getElementById("query-status").textContent = data.results.length + " result(s) found.  Select a person below."
}

let debounceTimer; // Timer for debouncing

function handlePeopleSearchInputChange(my_netid) {
    const inputText = document.getElementById("people-search-input").value.trim();

    // Clear the previous timer
    clearTimeout(debounceTimer);

    // Set a new timer to call handleSearch after 1 second
    debounceTimer = setTimeout(() => {
        if (inputText !== "") {
            handlePeopleSearchQuery(inputText, my_netid);
        }
    }, 1000); // 1000ms = 1 second
}

function selectPerson(row, person, my_netid) {
    // Clear previous selection
    document.querySelectorAll("#people-info-table tr").forEach(r => r.classList.remove("people-row-selected"));

    // Highlight the selected row
    row.classList.add("people-row-selected");

    // Some fun Easter Eggs :)
    var selectedPersonTextInfo = `Selected <b>${person.NetID} (${person.Name}, ${person["Primary Affiliation"]})</b>`
    if (person.NetID == "rf377" || person.NetID == "abb234") {
        selectedPersonTextInfo += " - 👀"
    }
    if (person.NetID == my_netid) {
        selectedPersonTextInfo += " - Wait, that's you!  While you can <i>technically</i> send a Lifted message to yourself, we encourage you to also spread the love to those around you :)"
    }

    // Update the status bar
    selectedPersonStatus = document.getElementById("selected-person-status");;
    selectedPersonStatus.className = "mt-4"
    const goodAffiliations = ["student", "faculty", "staff", "academic", "temporary"]
    if (!goodAffiliations.includes(person["Primary Affiliation"])) {
        selectedPersonStatus.innerHTML = selectedPersonTextInfo + ".  This person is a(n) " + person["Primary Affiliation"] + ".  Are you sure you selected the correct person?"
        selectedPersonStatus.classList.add("alert")
        selectedPersonStatus.classList.add("alert-warning")
    } else {
        selectedPersonStatus.innerHTML = selectedPersonTextInfo
        selectedPersonStatus.classList.add("alert")
        selectedPersonStatus.classList.add("alert-success")
    }

    // Update the selected person's NetID in the "hidden" form
    document.getElementById("recipient_netid").value = person.NetID
}

// Admin Overrides Stuff
// Call once on page load
handleMessagesGroupRadioChange()

function handleMessagesGroupRadioChange(button) {
    // Updates the hidden form
    document.getElementById("message_group").value = button.value.trim()
    console.log(document.getElementById("message_group").value)
}