async function processAllCards() {

  const timeoutId = setTimeout(function () {
    location.reload();
  }, 3000);

  message_group = document.getElementById("message-query-dropdown").dataset.short_name.trim();
  process_pptx_pdf = document.getElementById("pptx-pdf-checkbox").checked
  process_alphabetical = document.getElementById("alphabetical-checkbox").checked

  const response = await fetch(`/process-all-cards/${message_group}?pptx-pdf=${process_pptx_pdf}&alphabetical=${process_alphabetical}`);
  if (!response.ok) {
    console.log(response.status)
    document.getElementById("process-all-cards-status").textContent = `There was an error: ${response.status}.  Make sure you selected a proper message group (note that you cannot download All-Time), make sure you've uploaded a template for the message group, or ask Reid for help.  Refresh the page to clear this error.`;
    clearTimeout(timeoutId);
  }
}

function deleteMessageConfirmation(id) {
  if (confirm('Are you sure you want to delete this message?  This cannot be undone')) {
    window.open(`/delete-message/${id}?go_to_admin=true`, "_self");
  }
}

async function handleMessagesQuery(inputText, messageGroupSelect) {
  queryStatus = document.getElementById("message-query-status")
  queryStatus.textContent = "Loading..."

  // Send a request to the Flask backend
  const response = await fetch(`/query-messages?q=${encodeURIComponent(inputText)}&mg=${encodeURIComponent(messageGroupSelect)}`);
  if (!response.ok) {
    queryStatus.textContent = `There was an error ${response.status}.  Try refreshing the page or try again later.  Please report this to Reid!!`
    return
  }
  const data = await response.json();

  // Update the table with the results
  const resultsTable = document.getElementById("messages-info-table");
  const tableBody = resultsTable.querySelector("tbody");
  tableBody.innerHTML = ""; // Clear previous results

  if (data.results == "none") {
    queryStatus.textContent = "No results found.  Check your spelling or try typing in the exact NetID."
    return
  }

  // Populate the table with new data
  data.results.forEach(result => {
    const row = document.createElement("tr");
    // row.className = "table_hover"
    // console.log(result)
    row.innerHTML = `<td style="white-space: nowrap">
                        <button class="p-0" style="background: none; border: none;" type="button" data-bs-toggle="modal"
                        data-bs-target="#card-modal" onclick="getCardJson(${result["id"]})">💌</button>
                        <a class="px-1" href=/get-card-pdf/${result["id"]} target="_blank">⬇️</a>
                        <a class="px-1" href=/edit-message/${result["id"]}?show_admin_overrides=true>✍️</a>
                        <button class="p-0" style="background: none; border: none;" type="button" data-bs-toggle="modal"
                        data-bs-target="#delete-card-modal" onclick="document.getElementById('delete-card-modal_yes_button').setAttribute('href', '/delete-message/${result['id']}?go_to_admin=true')">🗑️</button>
                      </td>
                      <td>${result["created_timestamp"]}</td>
                      <td>${result["message_group"]}</td>
                      <td>${result["sender_email"]}</td>
                      <td>${result["recipient_email"]}</td>
                      <td>${result["sender_name"]}</td>
                      <td>${result["recipient_name"]}</td>
                      <td>${result["message_content"]}</td>
                      <td>${result["id"]}</td>`;

    // row.addEventListener("click", () => selectPerson(row, result));
    tableBody.appendChild(row);
  });

  document.getElementById("message-query-status").textContent = data.results.length + " result(s) found.  There are " + new Set(data.results.map((message) => message.sender_email)).size + " unique senders, and " + new Set(data.results.map((message) => message.recipient_email)).size + " unique recipients."
}

let debounceTimer; // Timer for debouncing

// Call once on page load
handleMessagesQueryInputChange()

function handleMessagesQueryInputChange() {
  const inputText = document.getElementById("message-query-input").value.trim();
  const dropdown = document.getElementById("message-query-dropdown")
  const messageGroupSelect = dropdown.dataset.short_name.trim();
  document.getElementById("process-all-cards-status").innerHTML = `Click to process cards from the <b>${dropdown.textContent}</b> message group.  You can change this selection using the dropdown at the top of the page.`
  document.getElementById("process-all-cards-btn").textContent = `Process ${dropdown.textContent}`

  // Clear the previous timer
  clearTimeout(debounceTimer);

  // Set a new timer to call handleSearch after 1 second
  debounceTimer = setTimeout(() => {
    handleMessagesQuery(inputText, messageGroupSelect);
  }, 1000); // 1000ms = 1 second
}

const Font = Quill.import('attributors/style/font');
Font.whitelist = ['georgia', 'arial', 'verdana'];
Quill.register(Font, true);

var Size = Quill.import('attributors/style/size');
Size.whitelist = ['10px', '11px', '12px', '14px', '16px', '18px', '20px'];
Quill.register(Size, true);

Quill.register(Quill.import('attributors/style/align'), true);


function saveRichText(type_short_name, send_email) {
  const editorHTML = quills[type_short_name].root.innerHTML;
  const editorDelta = quills[type_short_name].getContents();
  var subject = document.getElementById(`${type_short_name}-subject-input`)
  subject = subject ? subject.value : "No Subject"
  const message_group = document.getElementById('rich-text-query-dropdown').dataset.short_name

  fetch(`/save-rich-text/${message_group}/${type_short_name}?send_email=${send_email}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ html: editorHTML, delta: editorDelta, subject: subject })
  })
    .then(response => {
      if (response.ok) {
        alert('HTML saved successfully!');
      } else {
        alert('Failed to save HTML.');
      }
    });
}

document.getElementById('save-rich-text-btn').addEventListener('click', () => {
  
});