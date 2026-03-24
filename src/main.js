// =============================================
// ShortsCraft — Automated Shorts with Music + Video Player
// Zero input. Photo backgrounds. Background music. Video preview.
// =============================================

import { renderFrame, CANVAS_W, CANVAS_H } from './templates.js';
import { autoGenerateBatch, autoGenerateShort, getRandomContent, getRandomGradient, getRandomAccent } from './generator.js';
import { startPreloadAll, getRandomImage, getLoadProgress } from './backgrounds.js';
import { generateMusic, getMoodName } from './music.js';

// =============================================
// State
// =============================================
const state = {
    selectedCategory: 'all',
    batchCount: 5,
    isGenerating: false,
    generatedQueue: [],
    videoBlobs: new Map(),       // id -> Blob for playback
    musicBuffers: new Map(),     // category -> AudioBuffer (cached)
    history: JSON.parse(localStorage.getItem('shortscraft-history') || '[]'),
    stats: JSON.parse(localStorage.getItem('shortscraft-stats') || '{"created":0,"exported":0}'),
};

// =============================================
// Canvas refs
// =============================================
const liveCanvas = document.getElementById('live-canvas');
const liveCtx = liveCanvas.getContext('2d');
const renderCanvas = document.getElementById('render-canvas');
const renderCtx = renderCanvas.getContext('2d');

// =============================================
// Navigation
// =============================================
function initNav() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            document.getElementById(`page-${btn.dataset.page}`).classList.add('active');
        });
    });
}

// =============================================
// Category & Count Selection
// =============================================
function initCategories() {
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.category-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            state.selectedCategory = card.dataset.cat;
        });
    });
}

function initCountSelector() {
    document.querySelectorAll('.count-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.count-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.batchCount = parseInt(btn.dataset.count);
        });
    });
}

// =============================================
// Generate batch for a specific category
// =============================================
function generateBatchForCategory(count) {
    const categoryMap = { motivation: 'quotes', facts: 'facts', tips: 'tips', trending: 'trending', poems: 'poems' };
    const durationMap = { motivation: 7, facts: 9, tips: 8, trending: 8, poems: 10 };

    if (state.selectedCategory === 'all') return autoGenerateBatch(count);

    const cat = state.selectedCategory;
    const items = getRandomContent(cat, count);
    return items.map((content, i) => ({
        id: Date.now() + i,
        category: cat,
        content,
        style: { gradient: getRandomGradient(), textColor: '#ffffff', accentColor: getRandomAccent() },
        duration: durationMap[cat] || 8,
        templateId: categoryMap[cat] || 'quotes'
    }));
}

// =============================================
// Assign a photo background to a Short
// =============================================
function assignPhotoBackground(short) {
    const img = getRandomImage(short.category);
    if (img) short.style.backgroundImage = img;
}

// =============================================
// Music generation (with cache)
// =============================================
async function getMusicForCategory(category, duration) {
    const key = `${category}-${duration}`;
    if (state.musicBuffers.has(key)) return state.musicBuffers.get(key);

    try {
        const buffer = await generateMusic(category, duration);
        state.musicBuffers.set(key, buffer);
        return buffer;
    } catch (e) {
        console.warn('Music generation failed, exporting without audio:', e);
        return null;
    }
}

// =============================================
// THE MAIN AUTO-GENERATE FLOW
// =============================================
async function startAutoGenerate() {
    if (state.isGenerating) return;
    state.isGenerating = true;

    const megaBtn = document.getElementById('btn-auto-generate');
    megaBtn.classList.add('generating');

    const batch = generateBatchForCategory(state.batchCount);
    batch.forEach(short => assignPhotoBackground(short));
    state.generatedQueue = batch;
    state.videoBlobs.clear();

    // Show progress
    const progressEl = document.getElementById('batch-progress');
    const progressFill = document.getElementById('progress-fill');
    const progressLabel = document.getElementById('progress-label');
    const progressCount = document.getElementById('progress-count');
    progressEl.classList.remove('hidden');
    document.getElementById('queue-preview').classList.add('hidden');
    document.getElementById('done-area').classList.add('hidden');

    // Pre-generate music for each unique category
    const categories = [...new Set(batch.map(s => s.category))];
    progressLabel.textContent = `🎵 Generating background music...`;
    progressCount.textContent = `0/${batch.length}`;
    progressFill.style.width = '0%';

    for (const cat of categories) {
        const dur = batch.find(s => s.category === cat).duration;
        await getMusicForCategory(cat, dur);
    }

    // Render each Short
    for (let i = 0; i < batch.length; i++) {
        const short = batch[i];
        progressLabel.textContent = `Rendering video ${i + 1}...`;
        progressCount.textContent = `${i + 1}/${batch.length}`;
        progressFill.style.width = `${((i + 0.5) / batch.length) * 100}%`;

        document.getElementById('current-title').textContent = getShortTitle(short);
        document.getElementById('current-text').textContent = short.content.text.replace(/\\n/g, ' ');
        document.getElementById('current-badge').textContent = `${short.category.toUpperCase()} · 🎵 ${getMoodName(short.category)}`;

        // Record with music
        const blob = await recordVideoWithMusic(short, i);
        state.videoBlobs.set(short.id, blob);

        progressFill.style.width = `${((i + 1) / batch.length) * 100}%`;
        state.stats.created++;
        updateStats();
    }

    saveStats();
    progressEl.classList.add('hidden');
    megaBtn.classList.remove('generating');
    state.isGenerating = false;

    showQueuePreview();
}

// =============================================
// Record a single video WITH background music
// =============================================
function recordVideoWithMusic(short, index) {
    return new Promise(async (resolve) => {
        const fps = 30;
        const totalFrames = short.duration * fps;
        let frame = 0;

        // Get music buffer
        const musicBuffer = await getMusicForCategory(short.category, short.duration);

        // Create AudioContext for mixing
        const audioCtx = new AudioContext({ sampleRate: 44100 });
        const dest = audioCtx.createMediaStreamDestination();

        let audioSource = null;
        if (musicBuffer) {
            audioSource = audioCtx.createBufferSource();
            audioSource.buffer = musicBuffer;
            audioSource.connect(dest);
            audioSource.start(0);
        }

        // Combine video + audio streams
        const videoStream = renderCanvas.captureStream(fps);
        const combinedStream = new MediaStream();

        // Add video track
        videoStream.getVideoTracks().forEach(t => combinedStream.addTrack(t));

        // Add audio track if available
        if (musicBuffer) {
            dest.stream.getAudioTracks().forEach(t => combinedStream.addTrack(t));
        }

        const chunks = [];
        let mimeType = 'video/webm;codecs=vp9,opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm;codecs=vp8,opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm';

        const recorder = new MediaRecorder(combinedStream, { mimeType, videoBitsPerSecond: 5000000 });

        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = () => {
            if (audioSource) {
                try { audioSource.stop(); } catch (e) { }
            }
            audioCtx.close();
            const blob = new Blob(chunks, { type: 'video/webm' });
            resolve(blob);
        };

        recorder.start();

        function renderNextFrame() {
            if (frame >= totalFrames) {
                recorder.stop();
                return;
            }
            const time = frame / fps;
            renderFrame(renderCtx, short.templateId, time, short.duration, short.content, short.style);
            renderFrame(liveCtx, short.templateId, time, short.duration, short.content, short.style);
            frame++;
            requestAnimationFrame(renderNextFrame);
        }
        renderNextFrame();
    });
}

// =============================================
// Show Queue Preview with Play buttons
// =============================================
function showQueuePreview() {
    const queueEl = document.getElementById('queue-preview');
    const listEl = document.getElementById('queue-list');
    queueEl.classList.remove('hidden');

    listEl.innerHTML = state.generatedQueue.map((short, i) => {
        const canvasId = `queue-canvas-${i}`;
        const musicMood = getMoodName(short.category);
        return `
      <div class="queue-card" style="animation-delay: ${i * 0.1}s">
        <div class="queue-card-preview" data-video-id="${short.id}" data-index="${i}">
          <div class="play-overlay">
            <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </div>
          <canvas id="${canvasId}" width="1080" height="1920"></canvas>
        </div>
        <div class="queue-card-info">
          <span class="queue-cat">${short.category}</span>
          <span class="music-badge">🎵 ${musicMood}</span>
          <div class="queue-text">${short.content.text.replace(/\\n/g, ' ')}</div>
        </div>
      </div>
    `;
    }).join('');

    // Render static preview for each card
    state.generatedQueue.forEach((short, i) => {
        const canvas = document.getElementById(`queue-canvas-${i}`);
        if (canvas) {
            const ctx = canvas.getContext('2d');
            renderFrame(ctx, short.templateId, short.duration * 0.35, short.duration, short.content, short.style);
        }
    });

    // Add click handlers for play buttons
    listEl.querySelectorAll('.queue-card-preview').forEach(el => {
        el.addEventListener('click', () => {
            const videoId = parseInt(el.dataset.videoId);
            const index = parseInt(el.dataset.index);
            openVideoPlayer(videoId, index);
        });
    });
}

// =============================================
// Video Player Modal
// =============================================
function openVideoPlayer(videoId, index) {
    const blob = state.videoBlobs.get(videoId);
    if (!blob) return;

    const short = state.generatedQueue.find(s => s.id === videoId) ||
        state.history.find(s => s.id === videoId);
    if (!short) return;

    const modal = document.getElementById('video-modal');
    const video = document.getElementById('video-player');
    const badge = document.getElementById('video-info-badge');
    const title = document.getElementById('video-info-title');
    const text = document.getElementById('video-info-text');

    // Set video source
    const url = URL.createObjectURL(blob);
    video.src = url;
    video.onloadeddata = () => video.play();

    // Set info
    badge.textContent = `${short.category} · 🎵 ${getMoodName(short.category)}`;
    title.textContent = getShortTitle(short);
    text.textContent = short.content.text.replace(/\\n/g, '\n');

    // Store current video url for download
    modal.dataset.currentUrl = url;
    modal.dataset.currentName = `short-${short.category}-${(index || 0) + 1}-${Date.now()}.webm`;

    modal.classList.remove('hidden');
}

function closeVideoPlayer() {
    const modal = document.getElementById('video-modal');
    const video = document.getElementById('video-player');
    video.pause();
    video.src = '';
    if (modal.dataset.currentUrl) {
        URL.revokeObjectURL(modal.dataset.currentUrl);
    }
    modal.classList.add('hidden');
}

function downloadCurrentVideo() {
    const modal = document.getElementById('video-modal');
    const url = modal.dataset.currentUrl;
    const name = modal.dataset.currentName;
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
}

// =============================================
// Export All Videos
// =============================================
async function exportAllVideos() {
    const progressEl = document.getElementById('batch-progress');
    const progressFill = document.getElementById('progress-fill');
    const progressLabel = document.getElementById('progress-label');
    const progressCount = document.getElementById('progress-count');
    progressEl.classList.remove('hidden');
    document.getElementById('queue-preview').classList.add('hidden');

    let exported = 0;

    for (let i = 0; i < state.generatedQueue.length; i++) {
        const short = state.generatedQueue[i];
        progressLabel.textContent = `Exporting video ${i + 1}...`;
        progressCount.textContent = `${i + 1}/${state.generatedQueue.length}`;
        progressFill.style.width = `${((i + 1) / state.generatedQueue.length) * 100}%`;

        document.getElementById('current-title').textContent = getShortTitle(short);
        document.getElementById('current-text').textContent = short.content.text.replace(/\\n/g, ' ');
        document.getElementById('current-badge').textContent = 'EXPORTING';

        // Video already recorded with music — just download the blob
        const blob = state.videoBlobs.get(short.id);
        if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `short-${short.category}-${i + 1}-${Date.now()}.webm`;
            a.click();
            URL.revokeObjectURL(url);
        }

        exported++;
        state.stats.exported++;

        // Small delay between downloads to avoid browser blocking
        await new Promise(r => setTimeout(r, 500));
    }

    updateStats();
    saveStats();

    // Add to history
    state.generatedQueue.forEach(short => {
        const { backgroundImage, ...cleanStyle } = short.style;
        state.history.unshift({ ...short, style: cleanStyle, exportedAt: new Date().toISOString() });
    });
    state.history = state.history.slice(0, 50);
    localStorage.setItem('shortscraft-history', JSON.stringify(state.history));

    progressEl.classList.add('hidden');
    const doneArea = document.getElementById('done-area');
    doneArea.classList.remove('hidden');
    document.getElementById('done-count').textContent = exported;

    renderGallery();
}

// =============================================
// Gallery
// =============================================
function renderGallery() {
    const grid = document.getElementById('gallery-grid');
    if (state.history.length === 0) {
        grid.innerHTML = `
      <div class="gallery-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="48"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/></svg>
        <p>No videos yet. Go to "Auto Generate" and create your first batch!</p>
      </div>`;
        return;
    }

    grid.innerHTML = state.history.map((short, i) => {
        const canvasId = `gallery-canvas-${i}`;
        const date = new Date(short.exportedAt).toLocaleDateString();
        return `
      <div class="gallery-card">
        <div class="gallery-card-preview" data-history-index="${i}">
          <div class="play-overlay">
            <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </div>
          <canvas id="${canvasId}" width="1080" height="1920"></canvas>
        </div>
        <div class="gallery-card-info">
          <span>${short.category} · ${date}</span>
        </div>
      </div>
    `;
    }).join('');

    state.history.forEach((short, i) => {
        const canvas = document.getElementById(`gallery-canvas-${i}`);
        if (canvas) {
            const ctx = canvas.getContext('2d');
            const img = getRandomImage(short.category);
            const styleWithImg = { ...short.style, backgroundImage: img };
            renderFrame(ctx, short.templateId, short.duration * 0.3, short.duration, short.content, styleWithImg);
        }
    });
}

// =============================================
// Helpers
// =============================================
function getShortTitle(short) {
    if (short.category === 'poems') return `📝 ${short.content.title || 'Poem'}`;
    if (short.category === 'motivation') return `"${short.content.text.substring(0, 40)}..."`;
    if (short.category === 'facts') return `${short.content.emoji || '🧠'} ${short.content.text.substring(0, 40)}...`;
    if (short.category === 'tips') return `💡 ${short.content.category || 'Tip'}`;
    if (short.category === 'trending') return short.content.hook || '🔥 Trending';
    return short.content.text.substring(0, 40);
}

function updateStats() {
    document.getElementById('stat-created').textContent = state.stats.created;
    document.getElementById('stat-exported').textContent = state.stats.exported;
}

function saveStats() {
    localStorage.setItem('shortscraft-stats', JSON.stringify(state.stats));
}

// =============================================
// Loading indicator
// =============================================
function showLoadingProgress() {
    const megaBtn = document.getElementById('btn-auto-generate');
    const sub = megaBtn.querySelector('.mega-btn-sub');
    const interval = setInterval(() => {
        const progress = getLoadProgress();
        if (progress >= 100) {
            sub.textContent = '🎵 Auto-creates videos with background music — Photos ready!';
            clearInterval(interval);
        } else {
            sub.textContent = `Loading photo backgrounds... ${progress}%`;
        }
    }, 500);
}

// =============================================
// Event Listeners
// =============================================
function initEvents() {
    document.getElementById('btn-auto-generate').addEventListener('click', startAutoGenerate);
    document.getElementById('btn-export-all').addEventListener('click', exportAllVideos);
    document.getElementById('btn-regenerate').addEventListener('click', () => {
        document.getElementById('queue-preview').classList.add('hidden');
        startAutoGenerate();
    });
    document.getElementById('btn-make-more').addEventListener('click', () => {
        document.getElementById('done-area').classList.add('hidden');
    });

    // Video modal
    document.getElementById('modal-close').addEventListener('click', closeVideoPlayer);
    document.getElementById('modal-backdrop').addEventListener('click', closeVideoPlayer);
    document.getElementById('btn-download-single').addEventListener('click', downloadCurrentVideo);

    // Escape key closes modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeVideoPlayer();
    });
}

// =============================================
// Init
// =============================================
function init() {
    initNav();
    initCategories();
    initCountSelector();
    initEvents();
    updateStats();
    renderGallery();
    startPreloadAll();
    showLoadingProgress();
}

document.fonts.ready.then(() => init());
