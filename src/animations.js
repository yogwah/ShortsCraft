// =============================================
// Animation Library for ShortsCraft
// =============================================

/**
 * Easing functions
 */
export const ease = {
  linear: t => t,
  easeInOut: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeOut: t => t * (2 - t),
  easeIn: t => t * t,
  easeOutBack: t => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
  easeOutElastic: t => {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1;
  },
  bounce: t => {
    if (t < 1 / 2.75) return 7.5625 * t * t;
    if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
  }
};

/**
 * Get animation progress for a given time window
 * @param {number} currentTime - current time in seconds
 * @param {number} startTime - when animation starts
 * @param {number} duration - how long animation takes
 * @param {Function} easingFn - easing function
 * @returns {number} 0-1 progress, -1 if not started yet
 */
export function getProgress(currentTime, startTime, duration, easingFn = ease.easeOut) {
  if (currentTime < startTime) return -1;
  const raw = Math.min(1, (currentTime - startTime) / duration);
  return easingFn(raw);
}

/**
 * Fade In effect — returns alpha 0-1
 */
export function fadeIn(ctx, currentTime, startTime, duration = 0.5) {
  const p = getProgress(currentTime, startTime, duration);
  return p < 0 ? 0 : p;
}

/**
 * Slide In from direction
 */
export function slideIn(currentTime, startTime, duration, direction, distance) {
  const p = getProgress(currentTime, startTime, duration, ease.easeOutBack);
  if (p < 0) return { x: direction === 'left' ? -distance : direction === 'right' ? distance : 0, y: direction === 'up' ? distance : direction === 'down' ? -distance : 0, alpha: 0 };
  const remaining = 1 - p;
  return {
    x: direction === 'left' ? -distance * remaining : direction === 'right' ? distance * remaining : 0,
    y: direction === 'up' ? distance * remaining : direction === 'down' ? -distance * remaining : 0,
    alpha: p
  };
}

/**
 * Scale In effect
 */
export function scaleIn(currentTime, startTime, duration = 0.5) {
  const p = getProgress(currentTime, startTime, duration, ease.easeOutElastic);
  return p < 0 ? 0 : p;
}

/**
 * Typewriter — returns number of characters to show
 */
export function typewriter(text, currentTime, startTime, charsPerSecond = 30) {
  if (currentTime < startTime) return '';
  const elapsed = currentTime - startTime;
  const numChars = Math.floor(elapsed * charsPerSecond);
  return text.substring(0, Math.min(numChars, text.length));
}

/**
 * Pulse effect — returns scale factor (oscillates around 1)
 */
export function pulse(currentTime, speed = 2, amount = 0.05) {
  return 1 + Math.sin(currentTime * speed * Math.PI * 2) * amount;
}

/**
 * Float effect — returns Y offset
 */
export function float(currentTime, speed = 1, amount = 10) {
  return Math.sin(currentTime * speed * Math.PI) * amount;
}

/**
 * Counter animation — counts from 0 to target
 */
export function counter(target, currentTime, startTime, duration = 1) {
  const p = getProgress(currentTime, startTime, duration, ease.easeOut);
  if (p < 0) return 0;
  return Math.round(target * p);
}

/**
 * Draw rounded rectangle
 */
export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Word-wrap text for canvas
 */
export function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0] || '';
  for (let i = 1; i < words.length; i++) {
    const testLine = currentLine + ' ' + words[i];
    if (ctx.measureText(testLine).width > maxWidth) {
      lines.push(currentLine);
      currentLine = words[i];
    } else {
      currentLine = testLine;
    }
  }
  lines.push(currentLine);
  return lines;
}

/**
 * Draw text with glow effect
 */
export function drawGlowText(ctx, text, x, y, color, glowColor, blur = 20) {
  ctx.save();
  ctx.shadowColor = glowColor || color;
  ctx.shadowBlur = blur;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.shadowBlur = 0;
  ctx.restore();
}

/**
 * Parse gradient string and create canvasGradient
 */
export function parseGradient(ctx, gradientStr, w, h) {
  // Parse CSS linear-gradient
  const match = gradientStr.match(/linear-gradient\((\d+)deg,\s*(.+)\)/);
  if (!match) {
    ctx.fillStyle = '#667eea';
    return;
  }
  const angle = parseInt(match[1]) * Math.PI / 180;
  const stops = match[2].split(/,(?![^(]*\))/).map(s => s.trim());

  const cx = w / 2, cy = h / 2;
  const len = Math.max(w, h);
  const x1 = cx - Math.cos(angle) * len / 2;
  const y1 = cy - Math.sin(angle) * len / 2;
  const x2 = cx + Math.cos(angle) * len / 2;
  const y2 = cy + Math.sin(angle) * len / 2;

  const grad = ctx.createLinearGradient(x1, y1, x2, y2);
  stops.forEach(stop => {
    const parts = stop.match(/(#[a-fA-F0-9]+|rgba?\([^)]+\))\s*(\d+%)?/);
    if (parts) {
      const color = parts[1];
      const pos = parts[2] ? parseInt(parts[2]) / 100 : null;
      if (pos !== null) grad.addColorStop(pos, color);
    }
  });
  return grad;
}
