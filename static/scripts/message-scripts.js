document.addEventListener('DOMContentLoaded', function () {
  // Get filter buttons
  const filterReceived = document.getElementById('filter-received');
  const filterSent = document.getElementById('filter-sent');


  // Function to set active class on tab links
  function setActiveLinks(type) {
    const receivedLinks = document.querySelectorAll('.nav-link[data-bs-target$="-received"]');
    const sentLinks = document.querySelectorAll('.nav-link[data-bs-target$="-sent"]');

    if (type === 'received') {
      receivedLinks.forEach(link => {
        link.classList.add('active');
        sentLinks.forEach(sentLink => {
          if (sentLink.getAttribute('data-bs-target').replace('-sent', '') ===
            link.getAttribute('data-bs-target').replace('-received', '')) {
            sentLink.classList.remove('active');
          }
        });
      });
    } else if (type === 'sent') {
      sentLinks.forEach(link => {
        link.classList.add('active');
        receivedLinks.forEach(receivedLink => {
          if (receivedLink.getAttribute('data-bs-target').replace('-received', '') ===
            link.getAttribute('data-bs-target').replace('-sent', '')) {
            receivedLink.classList.remove('active');
          }
        });
      });
    }
  }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
  // Apply hover effects to message thumbnails
  const messageThumbnails = document.querySelectorAll('.message-thumbnail');

  messageThumbnails.forEach(thumbnail => {
    thumbnail.addEventListener('mouseenter', function () {
      const img = this.querySelector('.message-icon-img');
      if (img) {
        img.style.transform = 'scale(1.15) rotate(-5deg)';
      }
    });

    thumbnail.addEventListener('mouseleave', function () {
      const img = this.querySelector('.message-icon-img');
      if (img) {
        img.style.transform = 'scale(1) rotate(0deg)';
      }
    });
  });
});

// When page loads, apply viewed style to previously viewed cards
document.addEventListener('DOMContentLoaded', function () {
  let viewedCards = JSON.parse(localStorage.getItem('viewedCards') || '[]');

  viewedCards.forEach(cardId => {
    const element = document.getElementById(cardId);
    if (element) {
      element.classList.add('viewed');
    }
  });
});

// Tab switching functionality
document.addEventListener('DOMContentLoaded', function () {
  const tabButtons = document.querySelectorAll('.tab-button');

  tabButtons.forEach(button => {
    button.addEventListener('click', function () {
      const tabId = this.getAttribute('data-tab');
      const parent = this.parentElement;
      const messageCategory = parent.parentElement;

      // Remove active class from all tab buttons in this group
      parent.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
      });

      // Add active class to clicked button
      this.classList.add('active');

      // Hide all message lists in this group
      messageCategory.querySelectorAll('.messages-list').forEach(list => {
        list.style.display = 'none';
      });

      // Show the selected tab
      document.getElementById(tabId).style.display = 'flex';
    });
  });
});

// Load card content by directly fetching the HTML and extracting the needed parts
function loadCard(cardId) {
  // Mark the indicator as active
  document.querySelectorAll('.message-indicator').forEach(indicator => {
    indicator.classList.remove('active');
  });

  const clickedIndicator = document.querySelector(`.message-indicator[data-card-id="${cardId}"]`);
  if (clickedIndicator) {
    clickedIndicator.classList.add('active');
  }

  // Apply color change to heart (from scripts.js)
  change_color(cardId);

  // Show loading state
  document.getElementById('empty-state').style.display = 'none';
  document.getElementById('card-container').style.display = 'block';
  document.getElementById('card-message-content').textContent = 'Loading message...';

  // Fetch the card HTML directly
  fetch(`/get-card-html/${cardId}`)
    .then(response => response.text())
    .then(html => {
      // Create a temporary div to parse the HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;

      // Extract the needed parts from the HTML
      try {
        const liftedCard = tempDiv.querySelector('.lifted-card');
        if (liftedCard) {
          // Extract recipient ID (NetID)
          const recipientId = liftedCard.querySelector('h4').textContent.trim();
          document.getElementById('card-recipient-id').textContent = recipientId;

          // Extract recipient name
          const recipientName = liftedCard.querySelector('p:nth-of-type(1)').textContent.replace('To:', '').trim();
          document.getElementById('card-recipient-name').textContent = recipientName;

          // Extract message content
          const messageContent = liftedCard.querySelector('.message-content').textContent.trim();
          document.getElementById('card-message-content').textContent = messageContent;

          // Extract sender name
          const senderName = liftedCard.querySelector('p:nth-of-type(3)').textContent.replace('From:', '').trim();
          document.getElementById('card-sender-name').textContent = senderName;

          // Extract timestamp if available
          const timestamp = tempDiv.querySelector('.text-muted');
          if (timestamp) {
            document.getElementById('card-timestamp').textContent = timestamp.textContent.trim();
          } else {
            document.getElementById('card-timestamp').textContent = '';
          }
        } else {
          throw new Error('Could not find card content');
        }
      } catch (error) {
        console.error('Error parsing card HTML:', error);
        document.getElementById('card-message-content').textContent = 'Error loading message. Please try again.';
      }
    })
    .catch(error => {
      console.error('Error fetching card HTML:', error);
      document.getElementById('card-message-content').textContent = 'Error loading message. Please try again.';
    });
}

function hideCard() {
  // Remove active class from all indicators
  document.querySelectorAll('.message-indicator').forEach(indicator => {
    indicator.classList.remove('active');
  });

  // Hide the card and show empty state
  document.getElementById('card-container').style.display = 'none';
  document.getElementById('empty-state').style.display = 'flex';
}