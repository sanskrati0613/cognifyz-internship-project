/* --------------------- */
/* UI INTERACTIONS */
/* --------------------- */
function changeBackground() {
  const colors = ['#ffcccb', '#ccffcc', '#add8e6', '#ffffcc', '#e6e6fa'];
  const randomIndex = Math.floor(Math.random() * colors.length);
  document.body.style.backgroundColor = colors[randomIndex];
}

function validateForm() {
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const message = document.getElementById('message').value.trim();
  const errorDisplay = document.getElementById('form-error');

  if (name.length < 3) {
    errorDisplay.textContent = "Name must be at least 3 characters.";
    return false;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    errorDisplay.textContent = "Please enter a valid email address.";
    return false;
  }

  if (message.length < 10) {
    errorDisplay.textContent = "Message must be at least 10 characters.";
    return false;
  }

  errorDisplay.textContent = "";
  alert("Form submitted successfully!");
  return true;
}

/* --------------------- */
/* MUSIC SEARCH */
/* --------------------- */
function searchMusic() {
  const term = document.getElementById("musicSearch").value.trim();
  if (!term) return;

  const url = `https://itunes.apple.com/search?entity=song&limit=5&term=${encodeURIComponent(term)}`;
  saveRecentSearch(term);

  fetch(url)
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById("musicContainer");
      container.innerHTML = "<p>Loading...</p>";

      if (data.results.length === 0) {
        container.innerHTML = "<p>No results found.</p>";
        return;
      }

      container.innerHTML = ""; // Clear loading

      data.results.forEach(track => {
        const div = document.createElement("div");
        div.className = "song-card";

        const img = track.artworkUrl100 || "";
        div.innerHTML = `
          <img src="${img}" alt="artwork" />
          <strong>${track.trackName}</strong>
          <p>Artist: ${track.artistName}</p>
          <audio controls src="${track.previewUrl}"></audio>
          <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(track.trackName + " " + track.artistName)}" target="_blank">Watch on YouTube</a>
        `;

        const bookmarkBtn = document.createElement("button");
        bookmarkBtn.className = "bookmark-btn";
        bookmarkBtn.textContent = "Bookmark";
        bookmarkBtn.onclick = () => bookmarkTrack(track);

        const playlistBtn = document.createElement("button");
        playlistBtn.className = "playlist-btn";
        playlistBtn.textContent = "Add to Playlist";
        playlistBtn.onclick = () => addToPlaylist(track);

        div.appendChild(bookmarkBtn);
        div.appendChild(playlistBtn);
        container.appendChild(div);
      });
    })
    .catch(err => {
      console.error("Error fetching music:", err);
      document.getElementById("musicContainer").textContent = "Failed to load songs.";
    });
}

/* --------------------- */
/* RECENT SEARCHES */
/* --------------------- */
function saveRecentSearch(term) {
  let searches = JSON.parse(localStorage.getItem("recentSearches")) || [];
  searches = [term, ...searches.filter(t => t !== term)].slice(0, 5);
  localStorage.setItem("recentSearches", JSON.stringify(searches));
  renderRecentSearches();
}

function renderRecentSearches() {
  const container = document.getElementById("recentSearches");
  const searches = JSON.parse(localStorage.getItem("recentSearches")) || [];
  container.innerHTML = "";

  searches.forEach((term, index) => {
    const wrapper = document.createElement("div");
    wrapper.className = "recent-chip";

    const btn = document.createElement("button");
    btn.textContent = term;
    btn.onclick = () => {
      document.getElementById("musicSearch").value = term;
      searchMusic();
    };

    const close = document.createElement("span");
    close.className = "close-icon";
    close.innerHTML = "✖";
    close.onclick = () => removeRecentSearch(index);

    wrapper.appendChild(btn);
    wrapper.appendChild(close);
    container.appendChild(wrapper);
  });
}

function removeRecentSearch(index) {
  let searches = JSON.parse(localStorage.getItem("recentSearches")) || [];
  searches.splice(index, 1);
  localStorage.setItem("recentSearches", JSON.stringify(searches));
  renderRecentSearches();
}

/* --------------------- */
/* BOOKMARKING */
/* --------------------- */
function bookmarkTrack(track) {
  let bookmarks = JSON.parse(localStorage.getItem("bookmarks")) || [];
  bookmarks = [...bookmarks.filter(t => t.trackId !== track.trackId), track];
  localStorage.setItem("bookmarks", JSON.stringify(bookmarks));
  renderBookmarks();
}

function renderBookmarks() {
  const container = document.getElementById("bookmarkedContainer");
  const bookmarks = JSON.parse(localStorage.getItem("bookmarks")) || [];
  container.innerHTML = "";

  if (bookmarks.length === 0) {
    container.innerHTML = "<p>No bookmarks yet.</p>";
    return;
  }

  bookmarks.forEach(track => {
    const div = document.createElement("div");
    div.className = "song-card";

    div.innerHTML = `
      <img src="${track.artworkUrl100}" alt="artwork" />
      <strong>${track.trackName}</strong>
      <p>Artist: ${track.artistName}</p>
      <audio controls src="${track.previewUrl}"></audio>
      <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(track.trackName + ' ' + track.artistName)}" target="_blank">Watch on YouTube</a>
    `;

    const bookmarkBtn = document.createElement("button");
    bookmarkBtn.className = "bookmark-btn";
    bookmarkBtn.textContent = "Bookmark";
    bookmarkBtn.onclick = () => bookmarkTrack(track);

    const playlistBtn = document.createElement("button");
    playlistBtn.className = "playlist-btn";
    playlistBtn.textContent = "Add to Playlist";
    playlistBtn.onclick = () => addToPlaylist(track);

    div.appendChild(bookmarkBtn);
    div.appendChild(playlistBtn);
    container.appendChild(div);
  });

  const clearBtn = document.createElement("button");
  clearBtn.className = "clear-btn";
  clearBtn.textContent = "Clear All Bookmarks";
  clearBtn.onclick = confirmClearAllBookmarks;
  container.appendChild(clearBtn);
}

function removeBookmark(trackId) {
  let bookmarks = JSON.parse(localStorage.getItem("bookmarks")) || [];
  bookmarks = bookmarks.filter(track => track.trackId !== trackId);
  localStorage.setItem("bookmarks", JSON.stringify(bookmarks));
  renderBookmarks();
}

function confirmRemoveBookmark(trackId) {
  if (confirm("Are you sure you want to remove this bookmark?")) {
    removeBookmark(trackId);
  }
}

function confirmClearAllBookmarks() {
  if (confirm("This will remove all bookmarks. Continue?")) {
    localStorage.removeItem("bookmarks");
    renderBookmarks();
  }
}

/* --------------------- */
/* PLAYLIST */
/* --------------------- */
function addToPlaylist(track) {
  try {
    const playlist = JSON.parse(localStorage.getItem("playlist")) || [];

    const exists = playlist.some(t => t.trackId === track.trackId);
    if (exists) {
      showToast("Already in playlist ⚠️");
      return;
    }

    const cleanTrack = {
      trackId: track.trackId,
      trackName: track.trackName,
      artistName: track.artistName,
      artworkUrl100: track.artworkUrl100,
      previewUrl: track.previewUrl
    };

    playlist.push(cleanTrack);
    localStorage.setItem("playlist", JSON.stringify(playlist));
    showToast("Added to playlist ✅");

    if (document.getElementById("playlistContainer")) {
      renderPlaylist();
    }
  } catch (error) {
    console.error("Playlist Save Error:", error);
    showToast("Error saving to playlist ❌");
  }
}

function renderPlaylist() {
  const container = document.getElementById("playlistContainer");
  if (!container) return;

  const playlist = JSON.parse(localStorage.getItem("playlist")) || [];
  container.innerHTML = "";

  if (playlist.length === 0) {
    container.innerHTML = `<p id="emptyMsg">Your playlist is empty. Add some music from the search page!</p>`;
    return;
  }

  playlist.forEach(track => {
    if (!track.trackId || !track.trackName || !track.artistName) return;

    const div = document.createElement("div");
    div.className = "song-card";

    div.innerHTML = `
      <img src="${track.artworkUrl100}" alt="artwork" />
      <strong>${track.trackName}</strong>
      <p>Artist: ${track.artistName}</p>
      <audio controls src="${track.previewUrl}"></audio>
      <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(track.trackName + ' ' + track.artistName)}" target="_blank">Watch on YouTube</a>
      <button class="remove-btn" onclick="removeFromPlaylist(${track.trackId})">Remove from Playlist</button>
    `;

    container.appendChild(div);
  });

  const clearBtn = document.createElement("button");
  clearBtn.className = "clear-btn";
  clearBtn.textContent = "Clear Entire Playlist";
  clearBtn.onclick = confirmClearPlaylist;
  container.appendChild(clearBtn);
}

function removeFromPlaylist(trackId) {
  let playlist = JSON.parse(localStorage.getItem("playlist")) || [];
  playlist = playlist.filter(track => track.trackId !== trackId);
  localStorage.setItem("playlist", JSON.stringify(playlist));
  renderPlaylist();
}

function confirmClearPlaylist() {
  if (confirm("Do you want to remove all songs from the playlist?")) {
    localStorage.removeItem("playlist");
    renderPlaylist();
  }
}

/* --------------------- */
/* TOAST NOTIFICATION */
/* --------------------- */
function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

/* --------------------- */
/* INITIALIZATION */
/* --------------------- */
document.addEventListener("DOMContentLoaded", () => {
  if (typeof renderRecentSearches === "function") renderRecentSearches();
  if (typeof renderBookmarks === "function") renderBookmarks();
  if (typeof renderPlaylist === "function") renderPlaylist();
});
