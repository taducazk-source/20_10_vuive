const lockScreen = document.querySelector("#lock-screen");
const siteContent = document.querySelector("#site-content");
const unlockForm = document.querySelector("#unlock-form");
const unlockPassword = document.querySelector("#unlock-password");
const lockError = document.querySelector("#lock-error");
const numberPad = document.querySelector("#number-pad");
const wishForm = document.querySelector("#wish-form");
const wishInput = document.querySelector("#wish-text");
const characterCount = document.querySelector("#character-count");
const wishList = document.querySelector("#wish-list");
const photoInput = document.querySelector("#photo-input");
const photoCarousel = document.querySelector("#photo-carousel");
const photoGrid = document.querySelector("#photo-grid");
const photoEmpty = document.querySelector("#photo-empty");
const photoPrevious = document.querySelector("#photo-previous");
const photoNext = document.querySelector("#photo-next");
const photoCount = document.querySelector("#photo-count");
const uploadHint = document.querySelector("#upload-hint");
const toast = document.querySelector("#toast");
const lightbox = document.querySelector("#lightbox");
const lightboxImage = document.querySelector("#lightbox-image");
const lightboxCaption = document.querySelector("#lightbox-caption");
const lightboxClose = document.querySelector("#lightbox-close");
const lightboxPrevious = document.querySelector("#lightbox-previous");
const lightboxNext = document.querySelector("#lightbox-next");
const lightboxCount = document.querySelector("#lightbox-count");
const videoTrack = document.querySelector("#video-track");
const videoCards = [...videoTrack.querySelectorAll(".video-card")];
const videoDots = [...document.querySelectorAll(".video-dot")];
const videoArrows = [...document.querySelectorAll(".video-arrow")];
const videoCount = document.querySelector("#video-count");
const musicAudio = document.querySelector("#music-audio");
const musicDock = document.querySelector("#music-dock");
const musicDockTitle = document.querySelector("#music-dock-title");
const musicDockToggle = document.querySelector("#music-dock-toggle");
const musicDockNext = document.querySelector("#music-dock-next");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const WISH_STORAGE_KEY = "thuong-gui-nguoi-yeu:wishes";
const PHOTO_STORAGE_KEY = "thuong-gui-nang:photos";
const PHOTO_AUTOPLAY_DELAY = 5 * 1000;
const UNLOCK_PASSWORD = "2212";
let MUSIC_TRACKS = [];
let toastTimeout;
let activePhotoCard = null;
let photoAutoplayTimer = null;
let photoScrollFrame = 0;
let photoTransitionTimer = null;
const photoCarouselPauseReasons = new Set();
let activeVideoIndex = 0;
let videoScrollFrame = 0;
let musicQueue = [];
let musicQueueIndex = -1;
let currentMusicIndex = -1;
let folderPhotoSignature = "";
let folderMusicSignature = "";
let mediaServerWarningShown = false;

function shuffleMusicQueue() {
  musicQueue = MUSIC_TRACKS.map((_, index) => index);
  for (let index = musicQueue.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [musicQueue[index], musicQueue[swapIndex]] = [musicQueue[swapIndex], musicQueue[index]];
  }
  if (musicQueue.length > 1 && musicQueue[0] === currentMusicIndex) {
    const swapIndex = 1 + Math.floor(Math.random() * (musicQueue.length - 1));
    [musicQueue[0], musicQueue[swapIndex]] = [musicQueue[swapIndex], musicQueue[0]];
  }
  musicQueueIndex = -1;
}

function updateMusicPlaybackState() {
  const isPlaying = !musicAudio.paused;
  musicDock.classList.toggle("is-playing", isPlaying);
  musicDockToggle.textContent = isPlaying ? "Ⅱ" : "▶";
  musicDockToggle.setAttribute("aria-label", isPlaying ? "Tạm dừng nhạc nền" : "Phát nhạc nền");
}

function playNextMusicTrack() {
  if (MUSIC_TRACKS.length === 0) return;
  if (musicQueueIndex + 1 >= musicQueue.length) shuffleMusicQueue();
  musicQueueIndex += 1;
  currentMusicIndex = musicQueue[musicQueueIndex];
  const track = MUSIC_TRACKS[currentMusicIndex];
  musicAudio.pause();
  musicAudio.src = track.src;
  musicAudio.load();
  musicDockTitle.textContent = track.title;
  musicDock.hidden = false;
  musicAudio.play().catch((error) => {
    updateMusicPlaybackState();
    if (error.name === "NotAllowedError") {
      showToast("Trình duyệt chưa cho phép phát nhạc. Hãy nhấn nút phát để thử lại.");
    }
  });
}

function toggleMusicPlayback() {
  if (musicAudio.paused) {
    if (currentMusicIndex < 0) {
      playNextMusicTrack();
    } else {
      musicAudio.play().catch((error) => {
        if (error.name === "NotAllowedError") showToast("Trình duyệt chưa cho phép phát nhạc. Hãy nhấn nút phát để thử lại.");
      });
    }
  } else {
    musicAudio.pause();
  }
}

musicDockToggle.addEventListener("click", toggleMusicPlayback);
musicDockNext.addEventListener("click", playNextMusicTrack);
musicAudio.addEventListener("play", updateMusicPlaybackState);
musicAudio.addEventListener("pause", updateMusicPlaybackState);
musicAudio.addEventListener("ended", playNextMusicTrack);
musicAudio.addEventListener("error", () => {
  const track = MUSIC_TRACKS[currentMusicIndex];
  if (track) showToast(`Trình duyệt không thể phát bài “${track.title}”. Hãy thử mở trang bằng trình duyệt hỗ trợ MP3.`);
});

function showHeartEffect(button) {
  const bounds = button.getBoundingClientRect();
  const heart = document.createElement("span");
  heart.className = "key-heart";
  heart.setAttribute("aria-hidden", "true");
  heart.textContent = Math.random() > 0.5 ? "♡" : "♥";
  heart.style.left = `${bounds.left + bounds.width / 2}px`;
  heart.style.top = `${bounds.top + bounds.height / 2}px`;
  lockScreen.append(heart);
  window.setTimeout(() => heart.remove(), reducedMotion.matches ? 100 : 950);
}

numberPad.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  showHeartEffect(button);
  lockError.textContent = "";
  if (button.dataset.key && unlockPassword.value.length < unlockPassword.maxLength) {
    unlockPassword.value += button.dataset.key;
  } else if (button.dataset.action === "backspace") {
    unlockPassword.value = unlockPassword.value.slice(0, -1);
  } else if (button.dataset.action === "clear") {
    unlockPassword.value = "";
  }
});

function updateVideoSlide(index) {
  const nextIndex = Math.max(0, Math.min(videoCards.length - 1, index));
  activeVideoIndex = nextIndex;
  videoDots.forEach((dot, dotIndex) => {
    const isActive = dotIndex === nextIndex;
    dot.classList.toggle("is-active", isActive);
    if (isActive) dot.setAttribute("aria-current", "true");
    else dot.removeAttribute("aria-current");
  });
  videoCount.textContent = `${String(nextIndex + 1).padStart(2, "0")} / ${String(videoCards.length).padStart(2, "0")}`;
  videoCards.forEach((card, cardIndex) => {
    if (cardIndex !== nextIndex) card.querySelector("video").pause();
  });
}

function goToVideo(index) {
  const nextIndex = Math.max(0, Math.min(videoCards.length - 1, index));
  videoTrack.scrollTo({
    left: nextIndex * videoTrack.clientWidth,
    behavior: reducedMotion.matches ? "auto" : "smooth",
  });
  updateVideoSlide(nextIndex);
}

videoDots.forEach((dot, index) => dot.addEventListener("click", () => goToVideo(index)));
videoArrows.forEach((arrow) => {
  arrow.addEventListener("click", () => {
    const direction = Number(arrow.dataset.videoDirection);
    const nextIndex = (activeVideoIndex + direction + videoCards.length) % videoCards.length;
    goToVideo(nextIndex);
  });
});
videoTrack.addEventListener("scroll", () => {
  if (videoScrollFrame) return;
  videoScrollFrame = window.requestAnimationFrame(() => {
    const index = Math.round(videoTrack.scrollLeft / videoTrack.clientWidth);
    if (index !== activeVideoIndex) updateVideoSlide(index);
    videoScrollFrame = 0;
  });
});
window.addEventListener("resize", () => {
  videoTrack.scrollTo({ left: activeVideoIndex * videoTrack.clientWidth, behavior: "auto" });
});
updateVideoSlide(0);

unlockForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (unlockPassword.value !== UNLOCK_PASSWORD) {
    lockError.textContent = "Mật khẩu chưa đúng rồi, thử lại nhé ♡";
    unlockPassword.value = "";
    return;
  }

  lockError.textContent = "";
  siteContent.hidden = false;
  lockScreen.hidden = true;
  document.body.classList.remove("is-locked");
  window.requestAnimationFrame(() => {
    updatePhotoCarousel();
    schedulePhotoAutoplay();
  });
  playNextMusicTrack();
});

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => toast.classList.remove("is-visible"), 3400);
}

function readSavedList(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    showToast("Không thể đọc nội dung đã lưu. Bạn vẫn có thể thêm nội dung mới.");
    return [];
  }
}

function persistList(key, items) {
  try {
    localStorage.setItem(key, JSON.stringify(items));
    return true;
  } catch (error) {
    if (error instanceof DOMException && (error.name === "QuotaExceededError" || error.name === "NS_ERROR_DOM_QUOTA_REACHED")) {
      showToast("Bộ nhớ trình duyệt đã đầy. Hãy xóa bớt ảnh hoặc dữ liệu trang để lưu thêm nhé.");
      return false;
    }
    showToast("Không thể lưu vào trình duyệt. Vui lòng kiểm tra cài đặt lưu trữ.");
    return false;
  }
}

function addWishCard(text, number) {
  const card = document.createElement("article");
  card.className = "wish-card";

  const heading = document.createElement("span");
  heading.className = "wish-number";
  heading.append(document.createTextNode(`${String(number).padStart(2, "0")} `));
  const label = document.createElement("span");
  label.textContent = "— NHẬT LINH";
  heading.append(label);

  const message = document.createElement("p");
  message.textContent = `“${text}”`;

  const author = document.createElement("span");
  author.className = "wish-author";
  author.append(document.createTextNode("Một lời nhắn từ anh "));
  const heart = document.createElement("span");
  heart.setAttribute("aria-hidden", "true");
  heart.textContent = "♡";
  author.append(heart);

  card.append(heading, message, author);
  wishList.prepend(card);
}

function restoreWishes() {
  const saved = readSavedList(WISH_STORAGE_KEY).filter((item) => typeof item === "string" && item.trim());
  saved.slice().reverse().forEach((message, index) => addWishCard(message, saved.length - index + 3));
}

wishInput.addEventListener("input", () => {
  characterCount.textContent = `${wishInput.value.length} / 260`;
});

wishForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = wishInput.value.trim();
  if (!text) {
    wishInput.focus();
    return;
  }

  const saved = readSavedList(WISH_STORAGE_KEY);
  if (!persistList(WISH_STORAGE_KEY, [text, ...saved])) return;

  addWishCard(text, saved.length + 4);
  wishForm.reset();
  characterCount.textContent = "0 / 260";
  showToast("Lời nhắn đã được gửi và lưu lại trên thiết bị này. ♡");
  wishList.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "center" });
});

function renderPhoto(dataUrl, name) {
  const card = document.createElement("figure");
  card.className = "photo-card user-photo-card";

  const image = document.createElement("img");
  image.src = dataUrl;
  image.alt = name ? `Ảnh kỷ niệm: ${name}` : "Ảnh kỷ niệm được thêm vào album";

  const caption = document.createElement("figcaption");
  const title = document.createElement("span");
  title.className = "photo-caption";
  title.textContent = name || "Một khoảnh khắc đáng yêu";

  const heart = document.createElement("span");
  heart.className = "photo-heart";
  heart.setAttribute("aria-hidden", "true");
  heart.textContent = "♡";

  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.className = "remove-photo";
  removeButton.setAttribute("aria-label", `Xóa ảnh ${name || "đã thêm"}`);
  removeButton.title = "Xóa ảnh này";
  removeButton.textContent = "×";
  removeButton.addEventListener("click", (event) => {
    event.stopPropagation();
    const saved = readSavedList(PHOTO_STORAGE_KEY);
    const index = saved.findIndex((photo) => photo.dataUrl === dataUrl && (photo.name || "") === (name || ""));
    if (index < 0) {
      card.remove();
      updateEmptyState();
      return;
    }
    saved.splice(index, 1);
    if (!persistList(PHOTO_STORAGE_KEY, saved)) return;
    card.remove();
    updateEmptyState();
    showToast("Đã xóa ảnh khỏi album.");
  });

  caption.append(title, heart, removeButton);
  card.append(image, caption);
  photoGrid.insertBefore(card, photoEmpty);
}

function renderFolderPhotos(photos) {
  const existingPhotos = [...photoGrid.querySelectorAll(".folder-photo-card")];
  const signature = JSON.stringify(photos.map((photo) => photo.src));
  if (signature === folderPhotoSignature) return;

  existingPhotos.forEach((card) => card.remove());
  photos.forEach(({ src, caption, alt }) => {
    const card = document.createElement("figure");
    card.className = "photo-card folder-photo-card";
    card.dataset.folderPhoto = "true";

    const image = document.createElement("img");
    image.src = src;
    image.alt = alt;
    image.loading = "lazy";
    image.decoding = "async";

    const figcaption = document.createElement("figcaption");
    const title = document.createElement("span");
    title.textContent = caption;
    const heart = document.createElement("span");
    heart.className = "photo-heart";
    heart.setAttribute("aria-hidden", "true");
    heart.textContent = "♡";

    figcaption.append(title, heart);
    card.append(image, figcaption);
    photoGrid.insertBefore(card, photoEmpty);
  });
  folderPhotoSignature = signature;
  updateEmptyState();
}

async function refreshFolderMedia() {
  try {
    const [photoResponse, musicResponse] = await Promise.all([
      fetch("/api/photos", { cache: "no-store" }),
      fetch("/api/music", { cache: "no-store" }),
    ]);
    if (!photoResponse.ok || !musicResponse.ok) throw new Error("Media list unavailable");

    const [photos, tracks] = await Promise.all([photoResponse.json(), musicResponse.json()]);
    renderFolderPhotos(photos);

    const musicSignature = JSON.stringify(tracks.map((track) => track.src));
    if (musicSignature !== folderMusicSignature) {
      const previousSource = MUSIC_TRACKS[currentMusicIndex]?.src;
      MUSIC_TRACKS = tracks;
      folderMusicSignature = musicSignature;
      musicQueue = [];
      musicQueueIndex = -1;
      currentMusicIndex = previousSource
        ? MUSIC_TRACKS.findIndex((track) => track.src === previousSource)
        : -1;

      if (previousSource && currentMusicIndex < 0) {
        musicAudio.pause();
        if (MUSIC_TRACKS.length === 0) {
          musicAudio.removeAttribute("src");
          musicAudio.load();
          musicDock.hidden = true;
        }
      }

      if (currentMusicIndex < 0 && !siteContent.hidden && MUSIC_TRACKS.length > 0) {
        playNextMusicTrack();
      }
    }
    mediaServerWarningShown = false;
  } catch {
    if (!mediaServerWarningShown) {
      showToast("Hãy mở web bằng start.bat để tự đồng bộ ảnh và nhạc trong thư mục.");
      mediaServerWarningShown = true;
    }
  }
}

function updateEmptyState() {
  rebuildPhotoLoop();
  const hasPhotos = getPhotoCards().length > 0;
  photoEmpty.classList.toggle("is-hidden", hasPhotos);
  photoCarousel.classList.toggle("is-empty", !hasPhotos);
  updatePhotoCarousel();
  schedulePhotoAutoplay();
}

function getPhotoCards() {
  return [...photoGrid.querySelectorAll(".photo-card:not([data-photo-clone])")];
}

function rebuildPhotoLoop() {
  photoGrid.querySelectorAll("[data-photo-clone]").forEach((card) => card.remove());
  const cards = getPhotoCards();
  cards.forEach((card) => {
    const clone = card.cloneNode(true);
    clone.dataset.photoClone = "true";
    clone.setAttribute("aria-hidden", "true");
    clone.querySelectorAll("button").forEach((button) => {
      button.tabIndex = -1;
    });
    photoGrid.append(clone);
  });
}

function getPhotoCarouselMetrics() {
  const cards = getPhotoCards();
  if (cards.length < 2 || photoGrid.clientWidth === 0) {
    return { step: 0, maxIndex: 0, index: 0, maxScroll: 0 };
  }

  const step = photoGrid.clientWidth;
  const lastCard = cards[cards.length - 1];
  const originalContentEnd = lastCard.getBoundingClientRect().right
    - photoGrid.getBoundingClientRect().left
    + photoGrid.scrollLeft;
  const maxScroll = Math.max(0, originalContentEnd - photoGrid.clientWidth);
  const maxIndex = step > 0 ? Math.ceil(maxScroll / step) : 0;
  const index = step > 0 ? Math.min(maxIndex, Math.round(photoGrid.scrollLeft / step)) : 0;
  return { step, maxIndex, index, maxScroll, loopOffset: originalContentEnd };
}

function updatePhotoCarousel() {
  const { index, maxIndex } = getPhotoCarouselMetrics();
  photoCount.textContent = `${String(index + 1).padStart(2, "0")} / ${String(maxIndex + 1).padStart(2, "0")}`;
}

function schedulePhotoAutoplay() {
  window.clearTimeout(photoAutoplayTimer);
  if (
    photoCarouselPauseReasons.size > 0
    || document.hidden
    || siteContent.hidden
    || reducedMotion.matches
    || getPhotoCards().length < 2
  ) return;

  photoAutoplayTimer = window.setTimeout(() => movePhotoCarousel(1), PHOTO_AUTOPLAY_DELAY);
}

function finishPhotoTransition() {
  window.clearTimeout(photoTransitionTimer);
  const { loopOffset } = getPhotoCarouselMetrics();
  if (loopOffset && photoGrid.scrollLeft >= loopOffset - 1) {
    photoGrid.scrollTo({ left: 0, behavior: "auto" });
    updatePhotoCarousel();
  }
  photoGrid.classList.remove("is-transitioning");
  schedulePhotoAutoplay();
}

function movePhotoCarousel(direction) {
  const { step, maxIndex, index, maxScroll, loopOffset } = getPhotoCarouselMetrics();
  if (maxIndex === 0 || step === 0) {
    schedulePhotoAutoplay();
    return;
  }

  window.clearTimeout(photoTransitionTimer);
  photoGrid.classList.add("is-transitioning");
  photoGrid.style.setProperty("--photo-transition-offset", direction > 0 ? "10px" : "-10px");
  const shouldWrapForward = direction > 0 && index === maxIndex;
  const nextIndex = direction < 0 && index === 0
    ? maxIndex
    : Math.max(0, Math.min(maxIndex, index + direction));
  photoGrid.scrollTo({
    left: shouldWrapForward ? loopOffset : Math.min(maxScroll, nextIndex * step),
    behavior: reducedMotion.matches ? "auto" : "smooth",
  });
  updatePhotoCarousel();
  schedulePhotoAutoplay();
  if (reducedMotion.matches) {
    finishPhotoTransition();
  } else {
    photoTransitionTimer = window.setTimeout(finishPhotoTransition, 700);
  }
}

photoPrevious.addEventListener("click", () => movePhotoCarousel(-1));
photoNext.addEventListener("click", () => movePhotoCarousel(1));
photoGrid.addEventListener("scroll", () => {
  if (photoScrollFrame) return;
  photoScrollFrame = window.requestAnimationFrame(() => {
    updatePhotoCarousel();
    photoScrollFrame = 0;
  });
  schedulePhotoAutoplay();
});
photoGrid.addEventListener("scrollend", finishPhotoTransition);
photoGrid.addEventListener("keydown", (event) => {
  if (event.target !== photoGrid) return;
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    event.preventDefault();
    movePhotoCarousel(event.key === "ArrowLeft" ? -1 : 1);
  }
});
photoCarousel.addEventListener("pointerenter", (event) => {
  if (event.pointerType !== "mouse") return;
  photoCarouselPauseReasons.add("pointer");
  window.clearTimeout(photoAutoplayTimer);
});
photoCarousel.addEventListener("pointerleave", (event) => {
  if (event.pointerType !== "mouse") return;
  photoCarouselPauseReasons.delete("pointer");
  schedulePhotoAutoplay();
});
photoCarousel.addEventListener("focusin", () => {
  photoCarouselPauseReasons.add("focus");
  window.clearTimeout(photoAutoplayTimer);
});
photoCarousel.addEventListener("focusout", (event) => {
  if (photoCarousel.contains(event.relatedTarget)) return;
  photoCarouselPauseReasons.delete("focus");
  schedulePhotoAutoplay();
});
document.addEventListener("visibilitychange", schedulePhotoAutoplay);
window.addEventListener("resize", () => {
  window.requestAnimationFrame(() => {
    updatePhotoCarousel();
    schedulePhotoAutoplay();
  });
});

function restorePhotos() {
  const saved = readSavedList(PHOTO_STORAGE_KEY).filter(
    (photo) => photo && typeof photo.dataUrl === "string" && photo.dataUrl.startsWith("data:image/"),
  );
  saved.forEach((photo) => renderPhoto(photo.dataUrl, photo.name));
  updateEmptyState();
}

function updateLightboxPhoto() {
  const cards = getPhotoCards();
  const index = cards.indexOf(activePhotoCard);
  if (index < 0) {
    closeLightbox();
    return;
  }
  const image = activePhotoCard.querySelector("img");
  const caption = activePhotoCard.querySelector(".photo-caption")?.textContent
    || [...activePhotoCard.querySelectorAll("figcaption span")].find((span) => !span.hasAttribute("aria-hidden"))?.textContent
    || image.alt;
  lightboxImage.src = image.currentSrc || image.src;
  lightboxImage.alt = image.alt;
  lightboxCaption.textContent = caption;
  lightboxCount.textContent = `${String(index + 1).padStart(2, "0")} / ${String(cards.length).padStart(2, "0")}`;
}

function openLightbox(card) {
  activePhotoCard = card;
  photoCarouselPauseReasons.add("lightbox");
  window.clearTimeout(photoAutoplayTimer);
  updateLightboxPhoto();
  lightbox.showModal();
  document.body.classList.add("dialog-open");
}

function moveLightboxPhoto(direction) {
  const cards = getPhotoCards();
  if (!cards.length) return;
  const currentIndex = cards.indexOf(activePhotoCard);
  const nextIndex = (currentIndex + direction + cards.length) % cards.length;
  activePhotoCard = cards[nextIndex];
  updateLightboxPhoto();
}

function closeLightbox() {
  lightbox.close();
  document.body.classList.remove("dialog-open");
  activePhotoCard = null;
  photoCarouselPauseReasons.delete("lightbox");
  schedulePhotoAutoplay();
}

lightboxClose.addEventListener("click", closeLightbox);
lightboxPrevious.addEventListener("click", () => moveLightboxPhoto(-1));
lightboxNext.addEventListener("click", () => moveLightboxPhoto(1));
lightbox.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    moveLightboxPhoto(-1);
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    moveLightboxPhoto(1);
  }
});
lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) closeLightbox();
});
lightbox.addEventListener("close", () => {
  document.body.classList.remove("dialog-open");
  activePhotoCard = null;
  photoCarouselPauseReasons.delete("lightbox");
  schedulePhotoAutoplay();
});
photoGrid.addEventListener("click", (event) => {
  if (event.target.closest(".remove-photo")) return;
  const card = event.target.closest(".photo-card");
  if (card?.dataset.photoClone !== "true" && card?.querySelector("img")) openLightbox(card);
});

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Không đọc được nội dung ảnh."));
    });
    reader.addEventListener("error", () => reject(reader.error || new Error("Không thể đọc tệp ảnh.")));
    reader.readAsDataURL(file);
  });
}

function compressImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => {
      const maxSide = 1200;
      const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("Trình duyệt không thể xử lý ảnh này."));
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/webp", 0.8));
    });
    image.addEventListener("error", () => reject(new Error("Tệp này không phải là ảnh hợp lệ.")));
    image.src = dataUrl;
  });
}

async function addPhotos(files) {
  const imageFiles = [...files].filter((file) => file.type.startsWith("image/"));
  if (imageFiles.length === 0) {
    showToast("Vui lòng chọn tệp ảnh để thêm vào album.");
    return;
  }

  const saved = readSavedList(PHOTO_STORAGE_KEY);
  let added = 0;

  for (const file of imageFiles) {
    if (file.size > 15 * 1024 * 1024) {
      showToast(`Ảnh “${file.name}” lớn hơn 15 MB nên chưa được thêm.`);
      continue;
    }

    try {
      const original = await readFileAsDataUrl(file);
      const dataUrl = await compressImage(original);
      const photo = { dataUrl, name: file.name.replace(/\.[^.]+$/, "").slice(0, 70) };
      const next = [...saved, photo];
      if (!persistList(PHOTO_STORAGE_KEY, next)) break;
      saved.push(photo);
      renderPhoto(photo.dataUrl, photo.name);
      updateEmptyState();
      added += 1;
    } catch (error) {
      showToast(error instanceof Error ? error.message : `Không thể xử lý ảnh “${file.name}”.`);
    }
  }

  if (added > 0) {
    showToast(added === 1 ? "Ảnh đã được thêm và lưu vào album. ♡" : `${added} ảnh đã được thêm và lưu vào album. ♡`);
  }
  photoInput.value = "";
}

photoInput.addEventListener("change", () => addPhotos(photoInput.files || []));

for (const eventName of ["dragenter", "dragover"]) {
  document.addEventListener(eventName, (event) => {
    event.preventDefault();
    document.body.classList.add("is-dragging");
    uploadHint.classList.add("drag-active");
  });
}

for (const eventName of ["dragleave", "drop"]) {
  document.addEventListener(eventName, (event) => {
    if (event.target instanceof Element && eventName === "dragleave" && event.target.closest(".upload-hint, .photo-grid")) return;
    event.preventDefault();
    document.body.classList.remove("is-dragging");
    uploadHint.classList.remove("drag-active");
    if (eventName === "drop" && event.dataTransfer?.files.length) {
      addPhotos(event.dataTransfer.files);
    }
  });
}

function createPetal() {
  if (document.hidden || reducedMotion.matches) return;
  const petal = document.createElement("span");
  petal.className = "petal";
  petal.textContent = Math.random() > 0.52 ? "✿" : "✾";
  petal.style.left = `${Math.random() * 100}%`;
  petal.style.fontSize = `${9 + Math.random() * 10}px`;
  petal.style.animationDuration = `${10 + Math.random() * 9}s`;
  petal.style.setProperty("--drift", `${Math.random() * 130 - 65}px`);
  document.querySelector("#petal-layer").append(petal);
  window.setTimeout(() => petal.remove(), 20000);
}

restoreWishes();
restorePhotos();
refreshFolderMedia();
window.setInterval(() => {
  if (!document.hidden) refreshFolderMedia();
}, 5000);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) refreshFolderMedia();
});
if (!reducedMotion.matches) window.setInterval(createPetal, 1100);
