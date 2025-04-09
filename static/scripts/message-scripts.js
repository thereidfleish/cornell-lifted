document.addEventListener('DOMContentLoaded', function () {
  // Count messages in sent tabs
  const sentCount = document.querySelectorAll('[id$="-sent"] .message-thumbnail').length;
  document.getElementById('sent-count').textContent = sentCount;

  // Count messages in received tabs
  const receivedCount = document.querySelectorAll('[id$="-received"] .message-thumbnail').length;
  document.getElementById('received-count').textContent = receivedCount;

  // Count unique event cards (counting timeline-event divs, skipping the legacy one)
  const eventCards = document.querySelectorAll('.timeline-event');
  // Subtract 1 for the legacy events section
  document.getElementById('events-count').textContent = Math.max(0, eventCards.length - 1);

  // Count rank badges
  const rankBadges = document.querySelectorAll('.rank-badge');
  document.getElementById('ranks-count').textContent = rankBadges.length;
});

document.addEventListener('DOMContentLoaded', function () {
  // Get filter buttons
  const filterAll = document.getElementById('filter-all');
  const filterReceived = document.getElementById('filter-received');
  const filterSent = document.getElementById('filter-sent');

  // Get all tab panes
  const receivedPanes = document.querySelectorAll('.tab-pane[id$="-received"]');
  const sentPanes = document.querySelectorAll('.tab-pane[id$="-sent"]');

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

  // Handle All Messages filter
  filterAll.addEventListener('click', function () {
    // Set active button
    filterAll.classList.add('active');
    filterReceived.classList.remove('active');
    filterSent.classList.remove('active');

    // Reset to show all tab panes based on the active tab links
    document.querySelectorAll('.message-tabs').forEach(tabGroup => {
      const activeLink = tabGroup.querySelector('.nav-link.active');
      if (activeLink) {
        const target = activeLink.getAttribute('data-bs-target');
        if (target) {
          const pane = document.querySelector(target);
          if (pane) {
            // Show this pane, hide others in this tab group
            const allPanes = tabGroup.querySelectorAll('.tab-pane');
            allPanes.forEach(p => {
              p.classList.remove('show', 'active');
            });
            pane.classList.add('show', 'active');
          }
        }
      }
    });

    // Show all cards
    document.querySelectorAll('.message-group-card').forEach(card => {
      card.style.display = '';
    });
  });

  // Handle Received Messages filter
  filterReceived.addEventListener('click', function () {
    // Set active button
    filterAll.classList.remove('active');
    filterReceived.classList.add('active');
    filterSent.classList.remove('active');

    // Show only received tab panes
    receivedPanes.forEach(pane => {
      pane.classList.add('show', 'active');
    });

    sentPanes.forEach(pane => {
      pane.classList.remove('show', 'active');
    });

    // Set the correct active class on nav links
    setActiveLinks('received');

    // Show cards with received messages, hide others
    document.querySelectorAll('.message-group-card').forEach(card => {
      const receivedPane = card.querySelector('.tab-pane[id$="-received"]');
      const hasEmptyMessage = receivedPane &&
        receivedPane.querySelector('.empty-message') !== null;

      if (hasEmptyMessage) {
        card.style.display = 'none'; // Hide cards with no received messages
      } else {
        card.style.display = ''; // Show cards with received messages
      }
    });
  });

  // Handle Sent Messages filter
  filterSent.addEventListener('click', function () {
    // Set active button
    filterAll.classList.remove('active');
    filterReceived.classList.remove('active');
    filterSent.classList.add('active');

    // Show only sent tab panes
    sentPanes.forEach(pane => {
      pane.classList.add('show', 'active');
    });

    receivedPanes.forEach(pane => {
      pane.classList.remove('show', 'active');
    });

    // Set the correct active class on nav links
    setActiveLinks('sent');

    // Show cards with sent messages, hide others
    document.querySelectorAll('.message-group-card').forEach(card => {
      const sentPane = card.querySelector('.tab-pane[id$="-sent"]');
      const hasEmptyMessage = sentPane &&
        sentPane.querySelector('.empty-message') !== null;

      if (hasEmptyMessage) {
        card.style.display = 'none'; // Hide cards with no sent messages
      } else {
        card.style.display = ''; // Show cards with sent messages
      }
    });
  });
});

// Function to change all tabs to a specific type
function changeAllTabs(tabType) {
  // Update active button
  document.querySelectorAll('.message-filter .btn').forEach(btn => {
    if (btn.textContent.toLowerCase().includes(tabType === 'all' ? 'all' : tabType)) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // If "All Messages" is selected, don't change any tabs
  if (tabType === 'all') {
    return;
  }

  // For specific tab types, change all tabs to that type
  document.querySelectorAll(`.nav-link[data-bs-target$="-${tabType}"]`).forEach(tab => {
    try {
      // Try to use Bootstrap's Tab API
      var tabInstance = new bootstrap.Tab(tab);
      tabInstance.show();
    } catch (e) {
      // Fallback: manual tab activation
      const target = tab.getAttribute('data-bs-target');
      if (target) {
        // Remove active class from all tabs in this group
        const tabContainer = tab.closest('.nav');
        if (tabContainer) {
          tabContainer.querySelectorAll('.nav-link').forEach(t => {
            t.classList.remove('active');
          });
        }

        // Make this tab active
        tab.classList.add('active');

        // Show this tab pane, hide others
        const tabContent = tab.closest('.message-tabs').querySelector('.tab-content');
        if (tabContent) {
          tabContent.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('show', 'active');
          });

          const tabPane = document.querySelector(target);
          if (tabPane) {
            tabPane.classList.add('show', 'active');
          }
        }
      }
    }
  });
}

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

function change_color(cardId) {
  // Store viewed cards in localStorage
  let viewedCards = JSON.parse(localStorage.getItem('viewedCards') || '[]');

  if (!viewedCards.includes(cardId)) {
    viewedCards.push(cardId);
    localStorage.setItem('viewedCards', JSON.stringify(viewedCards));
  }

  // Add viewed class to make the icon lighter in color
  document.getElementById(cardId).classList.add('viewed');
}

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

// Function from your original scripts.js
function change_color(id) {
  element = document.getElementById(id);
  if (element) {
    element.style.opacity = "0.6";
  }
}