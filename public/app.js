// Front-end logic for Khadija's Knowledge Hub

let allNotes = [];

document.addEventListener('DOMContentLoaded', () => {
  const noteForm = document.getElementById('note-form');
  const searchInput = document.getElementById('search-input');
  
  // Load initial data
  fetchNotes();
  fetchHealth();
  
  // Set up periodic health check every 4 seconds
  setInterval(fetchHealth, 4000);
  
  // Note creation handler
  noteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = document.getElementById('note-title').value.trim();
    const category = document.getElementById('note-category').value;
    const author = document.getElementById('note-author').value.trim();
    const content = document.getElementById('note-content').value.trim();
    
    if (!title || !content) return;
    
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, category, author, content })
      });
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to save note');
      }
      
      // Reset form and reload notes
      noteForm.reset();
      // Keep author populated for convenience
      document.getElementById('note-author').value = author;
      
      await fetchNotes();
      showNotification('Success', 'Note saved to MongoDB database!', 'success');
    } catch (error) {
      console.error('Error adding note:', error);
      showNotification('Error', error.message, 'error');
    }
  });
  
  // Search handler
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    filterAndRenderNotes(query);
  });
});

// Fetch all notes from database
async function fetchNotes() {
  const container = document.getElementById('notes-container');
  try {
    const response = await fetch('/api/notes');
    if (!response.ok) {
      throw new Error('Could not fetch resources');
    }
    allNotes = await response.json();
    document.getElementById('total-notes-count').textContent = allNotes.length;
    renderNotes(allNotes);
  } catch (error) {
    console.error('Error loading notes:', error);
    container.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-triangle-exclamation" style="color: var(--error)"></i>
        <p>Could not fetch notes from MongoDB. Please check if the Database Service is running.</p>
      </div>
    `;
  }
}

// Fetch backend health and updates status cards
async function fetchHealth() {
  const dbStatusEl = document.getElementById('db-status');
  const podNameEl = document.getElementById('pod-name');
  const uptimeEl = document.getElementById('server-uptime');
  
  try {
    const response = await fetch('/api/health');
    if (!response.ok) throw new Error('Unhealthy status code');
    const data = await response.json();
    
    // Update DB connection status pill
    dbStatusEl.textContent = data.database;
    dbStatusEl.className = 'value status-pill';
    
    if (data.database === 'Connected') {
      dbStatusEl.classList.add('connected');
    } else if (data.database.includes('Connecting')) {
      dbStatusEl.classList.add('connecting');
    } else {
      dbStatusEl.classList.add('error');
    }
    
    // Update active pod name
    podNameEl.textContent = data.podName;
    
    // Format and update uptime
    const minutes = Math.floor(data.uptime / 60);
    const seconds = Math.floor(data.uptime % 60);
    uptimeEl.textContent = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
    
  } catch (error) {
    dbStatusEl.textContent = 'Offline';
    dbStatusEl.className = 'value status-pill error';
    podNameEl.textContent = 'Server Unreachable';
    console.error('Failed to query health metrics:', error);
  }
}

// Delete a note
async function deleteNote(id) {
  if (!confirm('Are you sure you want to delete this resource?')) return;
  
  try {
    const response = await fetch(`/api/notes/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || 'Failed to delete note');
    }
    
    await fetchNotes();
    showNotification('Success', 'Resource deleted from database.', 'success');
  } catch (error) {
    console.error('Error deleting note:', error);
    showNotification('Error', error.message, 'error');
  }
}

// Render list of notes
function renderNotes(notes) {
  const container = document.getElementById('notes-container');
  
  if (notes.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-folder-open"></i>
        <p>No DevOps resources posted yet. Create the first one!</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = '';
  notes.forEach(note => {
    const noteCard = document.createElement('div');
    noteCard.className = 'note-card';
    
    const dateFormatted = new Date(note.createdAt).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Map categories to style tags
    let tagClass = 'tag-general';
    const cat = note.category ? note.category.toLowerCase() : '';
    if (cat.includes('kubernetes')) tagClass = 'tag-kubernetes';
    else if (cat.includes('docker')) tagClass = 'tag-docker';
    else if (cat.includes('jenkins') || cat.includes('ci/cd')) tagClass = 'tag-cicd';
    else if (cat.includes('terraform')) tagClass = 'tag-terraform';
    else if (cat.includes('aws') || cat.includes('cloud')) tagClass = 'tag-aws';
    
    noteCard.innerHTML = `
      <span class="category-tag ${tagClass}">${note.category || 'General'}</span>
      <h4>${escapeHtml(note.title)}</h4>
      <div class="note-body">${escapeHtml(note.content)}</div>
      <div class="note-footer">
        <div class="note-meta">
          <span class="author"><i class="fa-solid fa-user-pen"></i> ${escapeHtml(note.author)}</span>
          <span class="date"><i class="fa-regular fa-clock"></i> ${dateFormatted}</span>
        </div>
        <button class="btn-delete" onclick="deleteNote('${note._id}')" title="Delete note">
          <i class="fa-regular fa-trash-can"></i>
        </button>
      </div>
    `;
    container.appendChild(noteCard);
  });
}

// Filter notes locally
function filterAndRenderNotes(query) {
  if (!query) {
    renderNotes(allNotes);
    return;
  }
  
  const filtered = allNotes.filter(note => {
    return note.title.toLowerCase().includes(query) ||
           note.content.toLowerCase().includes(query) ||
           (note.category && note.category.toLowerCase().includes(query)) ||
           (note.author && note.author.toLowerCase().includes(query));
  });
  
  renderNotes(filtered);
}

// Helper to escape HTML characters
function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

// Simple dynamic notification display
function showNotification(title, message, type) {
  const notification = document.createElement('div');
  notification.style.position = 'fixed';
  notification.style.bottom = '20px';
  notification.style.right = '20px';
  notification.style.background = type === 'success' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)';
  notification.style.border = '1px solid rgba(255,255,255,0.2)';
  notification.style.color = '#fff';
  notification.style.padding = '12px 20px';
  notification.style.borderRadius = '8px';
  notification.style.zIndex = '9999';
  notification.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';
  notification.style.fontFamily = 'Outfit, sans-serif';
  notification.style.display = 'flex';
  notification.style.flexDirection = 'column';
  notification.style.gap = '4px';
  notification.style.animation = 'slideIn 0.3s ease';
  
  notification.innerHTML = `
    <strong style="font-size: 0.95rem;">${title}</strong>
    <span style="font-size: 0.85rem; opacity: 0.9;">${message}</span>
  `;
  
  document.body.appendChild(notification);
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.5s ease';
    setTimeout(() => notification.remove(), 500);
  }, 4000);
}
