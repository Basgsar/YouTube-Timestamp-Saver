// popup.js

// Utility function to convert seconds into HH:MM:SS or MM:SS format.
function secondsToHMS(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0 
    ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` 
    : `${m}:${s.toString().padStart(2, '0')}`;
}

// Load saved timestamps from chrome.storage and render them.
function loadTimestamps() {
  chrome.storage.local.get({ timestamps: [] }, function(result) {
    renderTimestamps(result.timestamps);
  });
}

function renderTimestamps(timestamps) {
  const container = document.getElementById('timestampContainer');
  container.innerHTML = '';

  if (!timestamps.length) {
    container.innerHTML = '<p style="text-align:center; font-size: 1.1em;">No saved timestamps.</p>';
    return;
  }

  timestamps.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'timestamp-card';

    // Card Header: Thumbnail, Title, and Timestamp
    const header = document.createElement('div');
    header.className = 'card-header';

    const thumbnailImg = document.createElement('img');
    thumbnailImg.className = 'card-thumbnail';
    thumbnailImg.src = item.thumbnail || '';
    thumbnailImg.alt = "Thumbnail";

    const headerText = document.createElement('div');
    headerText.className = 'card-header-text';

    const titleElem = document.createElement('h4');
    titleElem.textContent = item.title;

    const timeElem = document.createElement('div');
    timeElem.className = 'card-time';
    timeElem.textContent = secondsToHMS(item.timestamp);

    headerText.appendChild(titleElem);
    headerText.appendChild(timeElem);
    header.appendChild(thumbnailImg);
    header.appendChild(headerText);

    // Card Details: Channel, Views, and Posted Date
    const details = document.createElement('div');
    details.className = 'card-details';
    details.innerHTML = `
      <p><strong>Channel:</strong> ${item.channel}</p>
      <p><strong>Views:</strong> ${item.views}</p>
      <p><strong>Posted:</strong> ${item.postedDate}</p>
    `;

    // Card Description Section with inline editing.
    const descriptionSection = document.createElement('div');
    descriptionSection.className = 'card-description';

    const descriptionText = document.createElement('p');
    descriptionText.textContent = item.description ? item.description : 'No description';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn-edit';
    editBtn.textContent = item.description ? 'Edit' : 'Add';

    editBtn.addEventListener('click', () => {
      // Replace the description with an input field and Save/Cancel buttons.
      descriptionSection.innerHTML = '';
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'description-input';
      input.value = item.description;
      input.placeholder = 'Enter description...';

      const saveBtn = document.createElement('button');
      saveBtn.className = 'btn-save';
      saveBtn.textContent = 'Save';

      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'btn-cancel';
      cancelBtn.textContent = 'Cancel';

      saveBtn.addEventListener('click', () => {
        updateTimestampDescription(index, input.value);
      });
      cancelBtn.addEventListener('click', () => {
        loadTimestamps();
      });

      descriptionSection.appendChild(input);
      descriptionSection.appendChild(saveBtn);
      descriptionSection.appendChild(cancelBtn);
    });

    descriptionSection.appendChild(descriptionText);
    descriptionSection.appendChild(editBtn);

    // Card Controls: Open and Delete buttons.
    const controls = document.createElement('div');
    controls.className = 'card-controls';

    const openBtn = document.createElement('button');
    openBtn.className = 'btn-open';
    openBtn.textContent = 'Open';
    openBtn.addEventListener('click', () => {
      const url = new URL(item.videoUrl);
      url.searchParams.set('t', item.timestamp);
      chrome.tabs.create({ url: url.toString() });
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-delete';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => {
      deleteTimestamp(index);
    });

    controls.appendChild(openBtn);
    controls.appendChild(deleteBtn);

    // Assemble the card.
    card.appendChild(header);
    card.appendChild(details);
    card.appendChild(descriptionSection);
    card.appendChild(controls);

    container.appendChild(card);
  });
}

function updateTimestampDescription(index, newDescription) {
  chrome.storage.local.get({ timestamps: [] }, function(result) {
    const timestamps = result.timestamps;
    if (index >= 0 && index < timestamps.length) {
      timestamps[index].description = newDescription;
      chrome.storage.local.set({ timestamps: timestamps }, loadTimestamps);
    }
  });
}

function deleteTimestamp(index) {
  chrome.storage.local.get({ timestamps: [] }, function(result) {
    const timestamps = result.timestamps;
    if (index >= 0 && index < timestamps.length) {
      timestamps.splice(index, 1);
      chrome.storage.local.set({ timestamps: timestamps }, loadTimestamps);
    }
  });
}

document.addEventListener('DOMContentLoaded', loadTimestamps);
