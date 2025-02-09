// content.js
(function() {
  // Get the video element.
  function getVideoElement() {
    return document.querySelector('video');
  }

  // Extract the video ID from the URL (e.g., ?v=VIDEO_ID).
  function extractVideoId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('v');
  }

  // Extract additional metadata from the YouTube page.
  // This includes channel name, views, posted date, and thumbnail.
  function getVideoMetadata() {
    const channelElem = document.querySelector('ytd-channel-name a');
    const viewCountElem = document.querySelector('.view-count');

    // Retrieve the posted date.
    let postedDate = "";
    const metaDateElem = document.querySelector('meta[itemprop="datePublished"]');
    if (
      metaDateElem &&
      metaDateElem.getAttribute('content') &&
      metaDateElem.getAttribute('content').match(/^\d{4}-\d{2}-\d{2}$/)
    ) {
      postedDate = metaDateElem.getAttribute('content');
    } else {
      // Fallback: look for the posted date element inside the #info-strings container.
      const postedDateElem = document.querySelector('#info-strings yt-formatted-string');
      postedDate = postedDateElem ? postedDateElem.textContent.trim() : "N/A";
    }

    const channel = channelElem ? channelElem.textContent.trim() : "Unknown Channel";
    const views = viewCountElem ? viewCountElem.textContent.trim() : "N/A";

    // Retrieve the thumbnail.
    const videoId = extractVideoId();
    let thumbnail = "";
    const thumbnailElem = document.querySelector('meta[property="og:image"]');
    if (thumbnailElem && thumbnailElem.getAttribute('content')) {
      const ogImage = thumbnailElem.getAttribute('content');
      // Check if the og:image URL actually matches the current video ID.
      if (videoId && ogImage.includes(videoId)) {
        thumbnail = ogImage;
      } else {
        // Fallback: construct the thumbnail URL using the current video ID.
        thumbnail = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : "";
      }
    } else {
      thumbnail = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : "";
    }

    return { channel, views, postedDate, thumbnail };
  }

  // Save the timestamp along with metadata to Chrome storage.
  function saveTimestamp(timestamp) {
    const videoId = extractVideoId();
    if (!videoId) {
      console.warn("Video ID not found.");
      return;
    }
    // Use the page title (removing " - YouTube" if present).
    const title = document.title.replace(" - YouTube", "");
    const metadata = getVideoMetadata();

    chrome.storage.local.get({ timestamps: [] }, function(result) {
      const timestamps = result.timestamps;
      timestamps.push({
        videoId: videoId,
        videoUrl: window.location.href.split('&')[0], // Basic URL without extra parameters.
        title: title,
        timestamp: timestamp,
        description: "",
        channel: metadata.channel,
        views: metadata.views,
        postedDate: metadata.postedDate,
        thumbnail: metadata.thumbnail
      });
      chrome.storage.local.set({ timestamps: timestamps }, function() {
        console.log("Timestamp saved:", timestamp);
      });
    });
  }

  // Listen for shift+clicks anywhere on the document.
  // If the click occurs within the YouTube timeline container, calculate the corresponding timestamp and save it.
  document.addEventListener('click', function(e) {
    if (e.shiftKey) {
      const progressBar = e.target.closest('.ytp-progress-bar-container');
      if (progressBar) {
        e.preventDefault();
        const rect = progressBar.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = rect.width;
        const video = getVideoElement();
        if (video && video.duration) {
          const newTime = (clickX / width) * video.duration;
          saveTimestamp(Math.floor(newTime));
          console.log("Saved timestamp:", Math.floor(newTime));
        } else {
          console.warn("Video element not found or duration unavailable.");
        }
      }
    }
  }, true);
})();
