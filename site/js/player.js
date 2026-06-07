/**
 * Underwriter EP — Custom Audio Player
 * Vanilla JS playlist with transport controls, seek, and volume.
 */

(function () {
  "use strict";

  /* ── Playlist Data ─────────────────────────────────── */
  const playlist = [
    { title: "A Void Reborn", src: "assets/audio/track1.wav" },
    { title: "No Need for Panic", src: "assets/audio/track2.wav" },
    { title: "Black Signal", src: "assets/audio/track3.wav" },
    { title: "The Experiment", src: "assets/audio/track4.wav" },
  ];

  let currentIndex = 0;
  let isPlaying = false;
  let isMuted = false;
  let savedVolume = 0.8;

  /* ── DOM References ────────────────────────────────── */
  const audio = new Audio();
  audio.preload = "metadata";
  audio.volume = savedVolume;

  const els = {};

  function cacheDom() {
    els.trackTitle = document.getElementById("player-track-title");
    els.btnPrev = document.getElementById("btn-prev");
    els.btnPlay = document.getElementById("btn-play");
    els.btnNext = document.getElementById("btn-next");
    els.seekWrap = document.getElementById("seek-bar-wrap");
    els.seekFill = document.getElementById("seek-bar-fill");
    els.timeCurrent = document.getElementById("time-current");
    els.timeDuration = document.getElementById("time-duration");
    els.btnMute = document.getElementById("btn-mute");
    els.volumeSlider = document.getElementById("volume-slider");
    els.tracklist = document.getElementById("tracklist");
  }

  /* ── Helpers ────────────────────────────────────────── */
  function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  function updateTracklistUI() {
    const items = els.tracklist.querySelectorAll("li");
    items.forEach(function (li, i) {
      li.classList.toggle("active", i === currentIndex);
    });
  }

  function setPlayIcon() {
    els.btnPlay.textContent = isPlaying ? "\u275A\u275A" : "\u25B6";
    els.btnPlay.setAttribute(
      "aria-label",
      isPlaying ? "Pause" : "Play"
    );
  }

  function updateMuteIcon() {
    if (isMuted || audio.volume === 0) {
      els.btnMute.textContent = "\uD83D\uDD07";
      els.btnMute.setAttribute("aria-label", "Unmute");
    } else if (audio.volume < 0.5) {
      els.btnMute.textContent = "\uD83D\uDD09";
      els.btnMute.setAttribute("aria-label", "Mute");
    } else {
      els.btnMute.textContent = "\uD83D\uDD0A";
      els.btnMute.setAttribute("aria-label", "Mute");
    }
  }

  /* ── Track Loading ──────────────────────────────────── */
  function loadTrack(index, autoplay) {
    if (index < 0 || index >= playlist.length) return;
    currentIndex = index;
    const track = playlist[currentIndex];

    audio.src = track.src;
    els.trackTitle.innerHTML =
      '<span class="track-number">' +
      (currentIndex + 1) +
      ".</span> " +
      track.title;

    els.seekFill.style.width = "0%";
    els.timeCurrent.textContent = "0:00";
    els.timeDuration.textContent = "0:00";

    updateTracklistUI();

    if (autoplay) {
      playAudio();
    } else {
      isPlaying = false;
      setPlayIcon();
    }
  }

  function playAudio() {
    var promise = audio.play();
    if (promise !== undefined) {
      promise
        .then(function () {
          isPlaying = true;
          setPlayIcon();
        })
        .catch(function () {
          // Autoplay blocked or file missing — fail silently
          isPlaying = false;
          setPlayIcon();
        });
    }
  }

  function pauseAudio() {
    audio.pause();
    isPlaying = false;
    setPlayIcon();
  }

  /* ── Controls ───────────────────────────────────────── */
  function togglePlay() {
    if (isPlaying) {
      pauseAudio();
    } else {
      playAudio();
    }
  }

  function prevTrack() {
    var idx = currentIndex - 1;
    if (idx < 0) idx = playlist.length - 1;
    loadTrack(idx, true);
  }

  function nextTrack() {
    var idx = currentIndex + 1;
    if (idx >= playlist.length) idx = 0;
    loadTrack(idx, true);
  }

  function handleSeek(e) {
    if (!audio.duration) return;
    var rect = els.seekWrap.getBoundingClientRect();
    var ratio = (e.clientX - rect.left) / rect.width;
    ratio = Math.max(0, Math.min(1, ratio));
    audio.currentTime = ratio * audio.duration;
  }

  function toggleMute() {
    if (isMuted) {
      isMuted = false;
      audio.volume = savedVolume || 0.5;
      els.volumeSlider.value = audio.volume;
    } else {
      savedVolume = audio.volume;
      isMuted = true;
      audio.volume = 0;
      els.volumeSlider.value = 0;
    }
    updateMuteIcon();
  }

  function handleVolumeChange() {
    audio.volume = parseFloat(els.volumeSlider.value);
    isMuted = audio.volume === 0;
    if (audio.volume > 0) savedVolume = audio.volume;
    updateMuteIcon();
  }

  /* ── Audio Events ───────────────────────────────────── */
  function onTimeUpdate() {
    if (!audio.duration) return;
    var pct = (audio.currentTime / audio.duration) * 100;
    els.seekFill.style.width = pct + "%";
    els.timeCurrent.textContent = formatTime(audio.currentTime);
  }

  function onLoadedMetadata() {
    els.timeDuration.textContent = formatTime(audio.duration);
  }

  function onTrackEnd() {
    nextTrack();
  }

  function onError() {
    // Fail silently if files are missing
    els.timeDuration.textContent = "--:--";
  }

  /* ── Seek Drag Support ──────────────────────────────── */
  var isSeeking = false;

  function seekPointerDown(e) {
    isSeeking = true;
    handleSeek(e);
  }

  function seekPointerMove(e) {
    if (isSeeking) handleSeek(e);
  }

  function seekPointerUp() {
    isSeeking = false;
  }

  /* ── Build Tracklist DOM ────────────────────────────── */
  function buildTracklist() {
    playlist.forEach(function (track, i) {
      var li = document.createElement("li");
      li.innerHTML =
        '<span class="track-num">' +
        (i + 1) +
        '</span><span class="track-name">' +
        track.title +
        "</span>";
      li.addEventListener("click", function () {
        loadTrack(i, true);
      });
      els.tracklist.appendChild(li);
    });
  }

  /* ── Init ───────────────────────────────────────────── */
  function init() {
    cacheDom();
    buildTracklist();

    // Button listeners
    els.btnPlay.addEventListener("click", togglePlay);
    els.btnPrev.addEventListener("click", prevTrack);
    els.btnNext.addEventListener("click", nextTrack);
    els.btnMute.addEventListener("click", toggleMute);
    els.volumeSlider.addEventListener("input", handleVolumeChange);

    // Seek bar drag
    els.seekWrap.addEventListener("pointerdown", seekPointerDown);
    document.addEventListener("pointermove", seekPointerMove);
    document.addEventListener("pointerup", seekPointerUp);

    // Audio events
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onTrackEnd);
    audio.addEventListener("error", onError);

    // Volume init
    els.volumeSlider.value = audio.volume;
    updateMuteIcon();

    // Load first track without autoplay
    loadTrack(0, false);
  }

  // Kick off when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
