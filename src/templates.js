// =============================================
// Video Template Engine — ShortsCraft
// Now with photo backgrounds + poems template
// =============================================

import { fadeIn, slideIn, scaleIn, typewriter, pulse, float, counter, roundRect, wrapText, drawGlowText, parseGradient, ease, getProgress } from './animations.js';

const W = 1080;
const H = 1920;

// =============================================
// Shared: Draw background — photo or gradient
// =============================================
function drawBackground(ctx, style) {
    // If a photo is available, draw it
    if (style.backgroundImage) {
        const img = style.backgroundImage;
        // Cover fit
        const imgRatio = img.width / img.height;
        const canvasRatio = W / H;
        let sx = 0, sy = 0, sw = img.width, sh = img.height;
        if (imgRatio > canvasRatio) {
            sw = img.height * canvasRatio;
            sx = (img.width - sw) / 2;
        } else {
            sh = img.width / canvasRatio;
            sy = (img.height - sh) / 2;
        }
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);

        // Dark overlay for text readability
        const overlay = ctx.createLinearGradient(0, 0, 0, H);
        overlay.addColorStop(0, 'rgba(0,0,0,0.4)');
        overlay.addColorStop(0.3, 'rgba(0,0,0,0.3)');
        overlay.addColorStop(0.7, 'rgba(0,0,0,0.3)');
        overlay.addColorStop(1, 'rgba(0,0,0,0.5)');
        ctx.fillStyle = overlay;
        ctx.fillRect(0, 0, W, H);
    } else {
        // Fallback to gradient
        const grad = parseGradient(ctx, style.gradient, W, H);
        if (grad) ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
    }
}

// =============================================
// Shared: Animated particles (soft bokeh on photos)
// =============================================
function drawParticles(ctx, time, hasPhoto, count = 30) {
    const alpha = hasPhoto ? 0.12 : 0.08;
    for (let i = 0; i < count; i++) {
        const seed = i * 137.5;
        const x = ((seed * 7.3 + time * 18 * (0.5 + (i % 5) * 0.2)) % (W + 100)) - 50;
        const y = ((seed * 13.7 + time * 12 * (0.3 + (i % 3) * 0.3)) % (H + 100)) - 50;
        const size = hasPhoto ? (4 + (i % 6) * 3) : (3 + (i % 5) * 2);
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fill();
    }
}

// =============================================
// Shared: Draw Follow CTA
// =============================================
function drawFollowCTA(ctx, time, duration, accentColor) {
    const ctaAlpha = fadeIn(ctx, time, duration - 1.5, 0.5);
    if (ctaAlpha > 0) {
        ctx.save();
        ctx.globalAlpha = ctaAlpha;
        const y = H - 180 + float(time, 1.5, 8);
        roundRect(ctx, W / 2 - 220, y - 30, 440, 60, 30);
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fill();
        ctx.font = `700 36px Inter`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = accentColor;
        ctx.fillText('👆 Follow for more!', W / 2, y);
        ctx.restore();
    }
}

// =============================================
// Template: MOTIVATION QUOTES
// =============================================
function renderQuotes(ctx, time, duration, data, style) {
    const { accentColor } = style;
    const quote = data.text || 'Stay hungry, stay foolish.';
    const author = data.author || 'Unknown';
    const hasPhoto = !!style.backgroundImage;

    drawBackground(ctx, style);
    drawParticles(ctx, time, hasPhoto);

    // Large opening quote marks
    const quoteScale = scaleIn(time, 0.2, 0.8);
    if (quoteScale > 0) {
        ctx.save();
        ctx.globalAlpha = hasPhoto ? 0.2 : 0.15;
        ctx.font = `bold ${400 * quoteScale}px Playfair Display`;
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText('\u201C', W / 2, 520);
        ctx.restore();
    }

    // Quote text with typewriter
    const quoteText = typewriter(quote, time, 0.6, 22);
    if (quoteText) {
        ctx.save();
        ctx.font = `italic 700 62px Playfair Display`;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        const lines = wrapText(ctx, `\u201C${quoteText}\u201D`, W - 160);
        const totalH = lines.length * 82;
        const startY = (H / 2) - totalH / 2 + 40;
        lines.forEach((line, i) => {
            const lineAlpha = fadeIn(ctx, time, 0.6 + i * 0.08, 0.3);
            ctx.globalAlpha = Math.max(0, lineAlpha);
            // Text shadow for readability on photos
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 15;
            ctx.fillText(line, W / 2, startY + i * 82);
        });
        ctx.restore();
    }

    // Divider line
    const divP = getProgress(time, 2.5, 0.5, ease.easeOut);
    if (divP > 0) {
        ctx.save();
        ctx.globalAlpha = divP;
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 3;
        ctx.shadowColor = accentColor;
        ctx.shadowBlur = 10;
        const lw = 100 * divP;
        ctx.beginPath();
        ctx.moveTo(W / 2 - lw, H / 2 + 220);
        ctx.lineTo(W / 2 + lw, H / 2 + 220);
        ctx.stroke();
        ctx.restore();
    }

    // Author
    const authorSlide = slideIn(time, 2.8, 0.6, 'up', 50);
    if (authorSlide.alpha > 0) {
        ctx.save();
        ctx.globalAlpha = authorSlide.alpha;
        ctx.font = `600 44px Inter`;
        ctx.textAlign = 'center';
        ctx.fillStyle = accentColor;
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 12;
        ctx.fillText(`\u2014 ${author}`, W / 2, H / 2 + 300 + authorSlide.y);
        ctx.restore();
    }

    drawFollowCTA(ctx, time, duration, accentColor);
}

// =============================================
// Template: FACTS
// =============================================
function renderFacts(ctx, time, duration, data, style) {
    const { accentColor } = style;
    const fact = data.text || 'An amazing fact goes here.';
    const emoji = data.emoji || '\ud83e\udde0';
    const stat = data.stat || '100';
    const hasPhoto = !!style.backgroundImage;

    drawBackground(ctx, style);
    drawParticles(ctx, time, hasPhoto);

    // "DID YOU KNOW?" label
    const labelAlpha = fadeIn(ctx, time, 0.3, 0.5);
    if (labelAlpha > 0) {
        ctx.save();
        ctx.globalAlpha = labelAlpha;
        ctx.font = `bold 42px Inter`;
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 15;
        drawGlowText(ctx, `${emoji} DID YOU KNOW?`, W / 2, 380, accentColor, accentColor, 30);
        ctx.restore();
    }

    // Divider
    const lineP = getProgress(time, 0.5, 0.6, ease.easeOut);
    if (lineP > 0) {
        ctx.save();
        ctx.globalAlpha = lineP;
        const lineW = 200 * lineP;
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(W / 2 - lineW, 430);
        ctx.lineTo(W / 2 + lineW, 430);
        ctx.stroke();
        ctx.restore();
    }

    // Fact text with typewriter
    const factText = typewriter(fact, time, 0.8, 25);
    if (factText) {
        ctx.save();
        ctx.font = `bold 60px Inter`;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 15;
        const lines = wrapText(ctx, factText, W - 160);
        const startY = 560;
        lines.forEach((line, i) => {
            ctx.fillText(line, W / 2, startY + i * 82);
        });
        ctx.restore();
    }

    // Stat counter
    const counterP = getProgress(time, 2, 1, ease.easeOut);
    if (counterP > 0) {
        ctx.save();
        ctx.globalAlpha = counterP;
        const cy = 1350;
        roundRect(ctx, W / 2 - 120, cy - 80, 240, 160, 80);
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fill();
        const num = counter(parseInt(stat) || 100, time, 2, 1.5);
        ctx.font = `900 72px Inter`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        drawGlowText(ctx, num.toLocaleString(), W / 2, cy, accentColor, accentColor, 20);
        ctx.restore();
    }

    drawFollowCTA(ctx, time, duration, accentColor);
}

// =============================================
// Template: TIPS
// =============================================
function renderTips(ctx, time, duration, data, style) {
    const { accentColor } = style;
    const tipText = data.text || 'A useful life tip goes here.';
    const category = data.category || 'Life Hack';
    const hasPhoto = !!style.backgroundImage;

    drawBackground(ctx, style);
    drawParticles(ctx, time, hasPhoto);

    // Category badge
    const titleSlide = slideIn(time, 0.2, 0.6, 'down', 80);
    if (titleSlide.alpha > 0) {
        ctx.save();
        ctx.globalAlpha = titleSlide.alpha;
        const catText = `\ud83d\udca1 ${category.toUpperCase()}`;
        ctx.font = `800 40px Inter`;
        const catW = ctx.measureText(catText).width + 60;
        roundRect(ctx, W / 2 - catW / 2, 260 + titleSlide.y, catW, 60, 30);
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fill();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = accentColor;
        ctx.shadowColor = accentColor;
        ctx.shadowBlur = 10;
        ctx.fillText(catText, W / 2, 290 + titleSlide.y);
        ctx.restore();
    }

    // Large tip text
    const tipDisplay = typewriter(tipText, time, 0.8, 20);
    if (tipDisplay) {
        ctx.save();
        ctx.font = `bold 64px Inter`;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 15;
        const lines = wrapText(ctx, tipDisplay, W - 140);
        const totalH = lines.length * 86;
        const startY = H / 2 - totalH / 2;
        lines.forEach((line, i) => {
            const a = fadeIn(ctx, time, 0.8 + i * 0.1, 0.3);
            ctx.globalAlpha = Math.max(0, a);
            ctx.fillText(line, W / 2, startY + i * 86);
        });
        ctx.restore();
    }

    drawFollowCTA(ctx, time, duration, accentColor);
}

// =============================================
// Template: TRENDING
// =============================================
function renderTrending(ctx, time, duration, data, style) {
    const { accentColor } = style;
    const text = data.text || 'Something trending goes here.';
    const hook = data.hook || '\ud83d\udd25 TRENDING';
    const hasPhoto = !!style.backgroundImage;

    drawBackground(ctx, style);
    drawParticles(ctx, time, hasPhoto, 35);

    // Hook badge with scale animation
    const hookScale = scaleIn(time, 0.1, 0.6);
    if (hookScale > 0) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, hookScale);
        ctx.font = `900 ${48 * Math.min(1, hookScale)}px Inter`;
        ctx.textAlign = 'center';
        const hookW = ctx.measureText(hook).width + 80;
        roundRect(ctx, W / 2 - hookW / 2, 280, hookW, 70, 35);
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fill();
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 2;
        ctx.shadowColor = accentColor;
        ctx.shadowBlur = 15;
        ctx.stroke();
        ctx.textBaseline = 'middle';
        ctx.fillStyle = accentColor;
        ctx.fillText(hook, W / 2, 315);
        ctx.restore();
    }

    // Main text
    const mainText = typewriter(text, time, 0.6, 22);
    if (mainText) {
        ctx.save();
        ctx.font = `800 60px Inter`;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 15;
        const lines = wrapText(ctx, mainText, W - 140);
        const totalH = lines.length * 82;
        const startY = H / 2 - totalH / 2 + 40;
        lines.forEach((line, i) => {
            const a = fadeIn(ctx, time, 0.6 + i * 0.08, 0.3);
            ctx.globalAlpha = Math.max(0, a);
            ctx.fillText(line, W / 2, startY + i * 82);
        });
        ctx.restore();
    }

    // Share prompt
    const shareP = getProgress(time, duration - 2.5, 0.5, ease.easeOut);
    if (shareP > 0) {
        ctx.save();
        ctx.globalAlpha = shareP;
        const sy = H - 380;
        roundRect(ctx, W / 2 - 250, sy - 30, 500, 60, 30);
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fill();
        ctx.font = `700 34px Inter`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('\ud83d\udcac Share this with someone!', W / 2, sy);
        ctx.restore();
    }

    drawFollowCTA(ctx, time, duration, accentColor);
}

// =============================================
// Template: POEMS ✨
// =============================================
function renderPoems(ctx, time, duration, data, style) {
    const { accentColor } = style;
    const poem = data.text || 'Two roads diverged in a wood...';
    const author = data.author || 'Unknown';
    const title = data.title || 'Poem';
    const hasPhoto = !!style.backgroundImage;

    drawBackground(ctx, style);

    // Extra dreamy overlay for poems
    if (hasPhoto) {
        const dreamOverlay = ctx.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, H);
        dreamOverlay.addColorStop(0, 'rgba(0,0,0,0.1)');
        dreamOverlay.addColorStop(1, 'rgba(0,0,0,0.4)');
        ctx.fillStyle = dreamOverlay;
        ctx.fillRect(0, 0, W, H);
    }

    drawParticles(ctx, time, hasPhoto, 20);

    // Decorative top element - feather/pen emoji
    const penAlpha = fadeIn(ctx, time, 0.1, 0.8);
    if (penAlpha > 0) {
        ctx.save();
        ctx.globalAlpha = penAlpha * 0.25;
        ctx.font = `200px serif`;
        ctx.textAlign = 'center';
        ctx.fillText('\u270e', W / 2, 350);
        ctx.restore();
    }

    // Title with elegant styling
    const titleSlide = slideIn(time, 0.3, 0.6, 'down', 40);
    if (titleSlide.alpha > 0) {
        ctx.save();
        ctx.globalAlpha = titleSlide.alpha;
        ctx.font = `italic 900 44px Playfair Display`;
        ctx.textAlign = 'center';
        ctx.fillStyle = accentColor;
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 15;
        ctx.fillText(`\u2022 ${title} \u2022`, W / 2, 420 + titleSlide.y);
        ctx.restore();
    }

    // Poem text — line by line with gentle fade-in
    const poemLines = poem.split('\\n').filter(l => l.trim());
    const lineHeight = 76;
    const totalHeight = poemLines.length * lineHeight;
    const startY = (H / 2) - totalHeight / 2 + 60;

    poemLines.forEach((line, i) => {
        const lineStart = 0.8 + i * 0.5; // Each line fades in with delay
        const lineAlpha = fadeIn(ctx, time, lineStart, 0.6);
        if (lineAlpha > 0) {
            ctx.save();
            ctx.globalAlpha = lineAlpha;
            ctx.font = `italic 500 50px Playfair Display`;
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 15;
            // Wrap long lines
            const wrapped = wrapText(ctx, line.trim(), W - 160);
            wrapped.forEach((wl, wi) => {
                ctx.fillText(wl, W / 2, startY + i * lineHeight + wi * 58);
            });
            ctx.restore();
        }
    });

    // Bottom divider
    const divP = getProgress(time, duration - 3, 0.5, ease.easeOut);
    if (divP > 0) {
        ctx.save();
        ctx.globalAlpha = divP * 0.6;
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 2;
        ctx.shadowColor = accentColor;
        ctx.shadowBlur = 10;
        const lw = 80 * divP;
        const sy = startY + poemLines.length * lineHeight + 40;
        ctx.beginPath();
        ctx.moveTo(W / 2 - lw, sy);
        ctx.lineTo(W / 2 + lw, sy);
        ctx.stroke();
        ctx.restore();
    }

    // Author attribution
    const authorAlpha = fadeIn(ctx, time, duration - 2.5, 0.5);
    if (authorAlpha > 0) {
        ctx.save();
        ctx.globalAlpha = authorAlpha;
        ctx.font = `600 40px Inter`;
        ctx.textAlign = 'center';
        ctx.fillStyle = accentColor;
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 12;
        const ay = startY + poemLines.length * lineHeight + 100;
        ctx.fillText(`\u2014 ${author}`, W / 2, ay);
        ctx.restore();
    }

    drawFollowCTA(ctx, time, duration, accentColor);
}

// =============================================
// YTS Watermark — drawn on every video frame
// =============================================
function drawWatermark(ctx, time) {
    ctx.save();

    // Position: top-right corner with padding
    const x = W - 80;
    const y = 80;

    // Semi-transparent pill background
    const text = 'YTS';
    ctx.font = '900 52px Inter';
    const tw = ctx.measureText(text).width;
    const padX = 28, padY = 18;
    const pillW = tw + padX * 2;
    const pillH = 52 + padY * 2;

    ctx.globalAlpha = 0.55;
    roundRect(ctx, x - pillW / 2, y - pillH / 2, pillW, pillH, pillH / 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fill();

    // Border glow
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.7)';
    ctx.lineWidth = 2;
    roundRect(ctx, x - pillW / 2, y - pillH / 2, pillW, pillH, pillH / 2);
    ctx.stroke();

    // "YTS" text with glow
    ctx.globalAlpha = 0.85;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(168, 85, 247, 0.9)';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, x, y + 2);

    ctx.restore();
}

// =============================================
// Template: RIGHTS (Indian Political & Citizen Rights)
// =============================================
function renderRights(ctx, time, duration, data, style) {
    const { accentColor } = style;
    const text = data.text || 'Know your rights.';
    const article = data.article || '';
    const category = data.category || 'Rights';
    const emoji = data.emoji || '🏛️';
    const hasPhoto = !!style.backgroundImage;

    drawBackground(ctx, style);
    drawParticles(ctx, time, hasPhoto, 20);

    // Indian tricolor accent stripe at top
    const stripeH = 8;
    ctx.fillStyle = '#FF9933'; // Saffron
    ctx.fillRect(0, 0, W / 3, stripeH);
    ctx.fillStyle = '#FFFFFF'; // White
    ctx.fillRect(W / 3, 0, W / 3, stripeH);
    ctx.fillStyle = '#138808'; // Green
    ctx.fillRect(W * 2 / 3, 0, W / 3, stripeH);

    // Article badge with glow
    const badgeSlide = slideIn(time, 0.2, 0.5, 'down', 60);
    if (badgeSlide.alpha > 0) {
        ctx.save();
        ctx.globalAlpha = badgeSlide.alpha;
        const badgeText = `${emoji} ${article}`;
        ctx.font = '900 44px Inter';
        const bw = ctx.measureText(badgeText).width + 70;
        roundRect(ctx, W / 2 - bw / 2, 240 + badgeSlide.y, bw, 68, 34);
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fill();
        ctx.strokeStyle = '#FF9933';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#FF9933';
        ctx.shadowBlur = 15;
        roundRect(ctx, W / 2 - bw / 2, 240 + badgeSlide.y, bw, 68, 34);
        ctx.stroke();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#FF9933';
        ctx.fillText(badgeText, W / 2, 274 + badgeSlide.y);
        ctx.restore();
    }

    // Category tag
    const catSlide = slideIn(time, 0.4, 0.4, 'down', 40);
    if (catSlide.alpha > 0) {
        ctx.save();
        ctx.globalAlpha = catSlide.alpha;
        ctx.font = '700 32px Inter';
        const catText = category.toUpperCase();
        const cw = ctx.measureText(catText).width + 40;
        roundRect(ctx, W / 2 - cw / 2, 340 + catSlide.y, cw, 48, 24);
        ctx.fillStyle = 'rgba(19, 136, 8, 0.3)';
        ctx.fill();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#4ae68a';
        ctx.fillText(catText, W / 2, 364 + catSlide.y);
        ctx.restore();
    }

    // Main rights text with typewriter
    const display = typewriter(text, time, 0.8, 18);
    if (display) {
        ctx.save();
        ctx.font = 'bold 62px Inter';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 15;
        const lines = wrapText(ctx, display, W - 120);
        const totalH = lines.length * 84;
        const startY = H / 2 - totalH / 2 + 60;
        lines.forEach((line, i) => {
            const a = fadeIn(ctx, time, 0.8 + i * 0.1, 0.3);
            ctx.globalAlpha = Math.max(0, a);
            ctx.fillText(line, W / 2, startY + i * 84);
        });
        ctx.restore();
    }

    // Ashoka Chakra-inspired decoration at bottom
    const chakraAlpha = fadeIn(ctx, time, 1.5, 0.8);
    if (chakraAlpha > 0) {
        ctx.save();
        ctx.globalAlpha = chakraAlpha * 0.15;
        ctx.strokeStyle = '#000080';
        ctx.lineWidth = 3;
        const cx = W / 2;
        const cy = H - 280;
        const r = 80;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
        // 24 spokes
        for (let i = 0; i < 24; i++) {
            const angle = (i / 24) * Math.PI * 2 + time * 0.3;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
            ctx.stroke();
        }
        ctx.restore();
    }

    drawFollowCTA(ctx, time, duration, '#FF9933');
}

// =============================================
// Template Registry
// =============================================
export const templateRenderers = {
    quotes: renderQuotes,
    facts: renderFacts,
    tips: renderTips,
    trending: renderTrending,
    poems: renderPoems,
    rights: renderRights,
};

/**
 * Render a single frame for a given template
 * Draws the YTS watermark on every frame after the template
 */
export function renderFrame(ctx, templateId, time, duration, data, style) {
    ctx.clearRect(0, 0, W, H);
    const renderer = templateRenderers[templateId] || renderQuotes;
    renderer(ctx, time, duration, data, style);
    drawWatermark(ctx, time);
}

export const CANVAS_W = W;
export const CANVAS_H = H;
