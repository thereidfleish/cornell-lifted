// Load card content by fetching the card JSON
async function getCardJson(cardId, currentUserEmail, currentMessageGroup, hiddenCards) {
    const response = await fetch(`/get-card-json/${cardId}`);
      if (!response.ok) {
          document.getElementById('card-message-content').textContent = 'Error loading message. Try refreshing the page or try again later.  Please report this to lifted@cornell.edu!!';
          return
      }
      const card = await response.json();
    
      document.getElementById('card-recipient-id').textContent = card["recipient_email"].split("@")[0];
      document.getElementById('card-attachment').textContent = card["attachment"];
      document.getElementById('card-recipient-name').textContent = card["recipient_name"];
      document.getElementById('card-message-content').textContent = card["message_content"];
      document.getElementById('card-sender-name').textContent = card["sender_name"];
      if (currentUserEmail == card["sender_email"]) {
        document.getElementById('card-timestamp').textContent = "Message written " + card["created_timestamp"];
      }
  
      if (currentUserEmail == card["sender_email"] && card["message_group"] == currentMessageGroup) {
        document.getElementById('card-edit-delete-options').classList.remove('d-none');
        document.getElementById('edit-message-button').setAttribute("href", `/edit-message/${card['id']}`);
        document.getElementById('delete-card-modal_yes_button').setAttribute("href", `/delete-message/${card['id']}`)
      } else {
        document.getElementById('card-edit-delete-options').classList.add('d-none');
      }
  
      if (!hiddenCards.includes(card["message_group"])) {
        document.getElementById('card-print-options').classList.remove('d-none');
        const cardPDFForm = document.getElementById('card-pdf-form')
        cardPDFForm.setAttribute("action", `/get-card-pdf/${card['id']}`)
        cardPDFForm.querySelector("#card-pdf-button").textContent = "Download PDF"
        cardPDFForm.querySelector("#card-pdf-button").disabled = false
      } else {
        document.getElementById('card-print-options').classList.add('d-none');
      }
}