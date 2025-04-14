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

document.addEventListener('DOMContentLoaded', function () {
  const toggleButton = document.getElementById('toggle-semesters');
  const timelineContainer = document.getElementById('timeline-container');

  if (toggleButton) {
    toggleButton.addEventListener('click', function () {
      timelineContainer.classList.toggle('timeline-collapsed');
      timelineContainer.classList.toggle('timeline-expanded');

      // Update the button text based on current state
      const toggleText = document.querySelector('.toggle-text');
      if (timelineContainer.classList.contains('timeline-collapsed')) {
        toggleText.textContent = 'View Older Lifted Memories';
      } else {
        toggleText.textContent = 'Hide Older Memories';
      }
    });
  }
});