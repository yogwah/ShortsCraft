// =============================================
// Procedural Background Music Generator
// Uses Web Audio API to create ambient music
// Different moods for different content types
// =============================================

// Music mood configurations
const moods = {
    motivation: {
        name: 'Uplifting',
        baseFreq: 220,    // A3
        scale: [0, 2, 4, 5, 7, 9, 11, 12], // Major scale
        tempo: 80,
        padType: 'sine',
        bassType: 'triangle',
        reverbTime: 2.5,
        volume: 0.35,
    },
    facts: {
        name: 'Mysterious',
        baseFreq: 196,    // G3
        scale: [0, 2, 3, 5, 7, 8, 10, 12], // Natural minor
        tempo: 70,
        padType: 'sine',
        bassType: 'sine',
        reverbTime: 3,
        volume: 0.3,
    },
    tips: {
        name: 'Chill Lo-fi',
        baseFreq: 261.63, // C4
        scale: [0, 2, 4, 7, 9, 12],  // Pentatonic major
        tempo: 85,
        padType: 'triangle',
        bassType: 'sine',
        reverbTime: 2,
        volume: 0.3,
    },
    trending: {
        name: 'Energetic',
        baseFreq: 246.94, // B3
        scale: [0, 3, 5, 7, 10, 12],  // Minor pentatonic
        tempo: 100,
        padType: 'sawtooth',
        bassType: 'square',
        reverbTime: 1.5,
        volume: 0.25,
    },
    poems: {
        name: 'Dreamy Ambient',
        baseFreq: 174.61, // F3
        scale: [0, 2, 4, 5, 7, 9, 12], // Lydian-ish
        tempo: 60,
        padType: 'sine',
        bassType: 'sine',
        reverbTime: 4,
        volume: 0.3,
    },
    rights: {
        name: 'Bold Patriotic',
        baseFreq: 220,    // A3
        scale: [0, 2, 4, 5, 7, 9, 11, 12], // Major scale
        tempo: 75,
        padType: 'triangle',
        bassType: 'triangle',
        reverbTime: 3,
        volume: 0.3,
    }
};

/**
 * Convert semitone offset to frequency
 */
function semitonesToFreq(baseFreq, semitones) {
    return baseFreq * Math.pow(2, semitones / 12);
}

/**
 * Create a convolution reverb impulse response
 */
function createReverbIR(ctx, duration, decay) {
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * duration;
    const impulse = ctx.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
        const data = impulse.getChannelData(channel);
        for (let i = 0; i < length; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
        }
    }
    return impulse;
}

/**
 * Generate background music as an AudioBuffer for a given mood and duration
 */
export async function generateMusic(category, duration) {
    const mood = moods[category] || moods.motivation;
    const offlineCtx = new OfflineAudioContext(2, 44100 * duration, 44100);

    // Master volume
    const masterGain = offlineCtx.createGain();
    masterGain.gain.value = mood.volume;
    masterGain.connect(offlineCtx.destination);

    // Reverb
    const convolver = offlineCtx.createConvolver();
    convolver.buffer = createReverbIR(offlineCtx, mood.reverbTime, 2.5);
    const reverbGain = offlineCtx.createGain();
    reverbGain.gain.value = 0.5;
    convolver.connect(reverbGain);
    reverbGain.connect(masterGain);

    // Dry path
    const dryGain = offlineCtx.createGain();
    dryGain.gain.value = 0.7;
    dryGain.connect(masterGain);

    // ===== PAD (atmospheric layer) =====
    const padNotes = [0, 4, 7]; // Root chord
    padNotes.forEach(offset => {
        const osc = offlineCtx.createOscillator();
        osc.type = mood.padType;
        osc.frequency.value = semitonesToFreq(mood.baseFreq * 0.5, mood.scale[offset % mood.scale.length] || 0);

        // Slow LFO for movement
        const lfo = offlineCtx.createOscillator();
        lfo.frequency.value = 0.1 + Math.random() * 0.15;
        const lfoGain = offlineCtx.createGain();
        lfoGain.gain.value = 3;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start(0);

        const padGain = offlineCtx.createGain();
        padGain.gain.value = 0;
        // Fade in
        padGain.gain.linearRampToValueAtTime(0.15, 2);
        padGain.gain.setValueAtTime(0.15, duration - 2);
        // Fade out
        padGain.gain.linearRampToValueAtTime(0, duration);

        // Low pass filter for warmth
        const lpf = offlineCtx.createBiquadFilter();
        lpf.type = 'lowpass';
        lpf.frequency.value = 600 + Math.random() * 400;
        lpf.Q.value = 0.5;

        osc.connect(padGain);
        padGain.connect(lpf);
        lpf.connect(convolver);
        lpf.connect(dryGain);

        osc.start(0);
        osc.stop(duration);
        lfo.stop(duration);
    });

    // ===== BASS (subtle low-end pulse) =====
    const beatInterval = 60 / mood.tempo;
    const bassNotes = [0, 0, 5, 4]; // Simple progression
    let bassTime = 1; // Start after 1 second
    let bassIndex = 0;

    while (bassTime < duration - 1) {
        const noteIndex = bassNotes[bassIndex % bassNotes.length];
        const freq = semitonesToFreq(mood.baseFreq * 0.5, mood.scale[noteIndex % mood.scale.length] || 0);

        const osc = offlineCtx.createOscillator();
        osc.type = mood.bassType;
        osc.frequency.value = freq;

        const env = offlineCtx.createGain();
        env.gain.value = 0;
        env.gain.setValueAtTime(0, bassTime);
        env.gain.linearRampToValueAtTime(0.12, bassTime + 0.05);
        env.gain.exponentialRampToValueAtTime(0.001, bassTime + beatInterval * 1.8);

        const lpf = offlineCtx.createBiquadFilter();
        lpf.type = 'lowpass';
        lpf.frequency.value = 300;

        osc.connect(env);
        env.connect(lpf);
        lpf.connect(dryGain);

        osc.start(bassTime);
        osc.stop(bassTime + beatInterval * 2);

        bassTime += beatInterval * 2;
        bassIndex++;
    }

    // ===== MELODY HINTS (sparse arpeggiated notes) =====
    let melodyTime = 2;
    const melodyNotes = mood.scale.filter((_, i) => i < 6);

    while (melodyTime < duration - 2) {
        // Play a note every few beats, with some randomness
        const noteIdx = Math.floor(Math.random() * melodyNotes.length);
        const freq = semitonesToFreq(mood.baseFreq, melodyNotes[noteIdx]);

        const osc = offlineCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;

        const env = offlineCtx.createGain();
        env.gain.value = 0;
        env.gain.setValueAtTime(0, melodyTime);
        env.gain.linearRampToValueAtTime(0.06, melodyTime + 0.1);
        env.gain.exponentialRampToValueAtTime(0.001, melodyTime + 1.5);

        osc.connect(env);
        env.connect(convolver);

        osc.start(melodyTime);
        osc.stop(melodyTime + 2);

        // Random spacing between melody notes
        melodyTime += beatInterval * (2 + Math.floor(Math.random() * 4));
    }

    // ===== SUBTLE HI-HAT / SHAKER (for rhythm) =====
    if (category === 'trending' || category === 'tips') {
        let hatTime = 1;
        while (hatTime < duration - 1) {
            const bufferSize = 4410; // 0.1 sec
            const noiseBuffer = offlineCtx.createBuffer(1, bufferSize, 44100);
            const data = noiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 8);
            }

            const noise = offlineCtx.createBufferSource();
            noise.buffer = noiseBuffer;

            const hatGain = offlineCtx.createGain();
            hatGain.gain.value = 0.03;

            const hpf = offlineCtx.createBiquadFilter();
            hpf.type = 'highpass';
            hpf.frequency.value = 8000;

            noise.connect(hpf);
            hpf.connect(hatGain);
            hatGain.connect(dryGain);

            noise.start(hatTime);
            hatTime += beatInterval;
        }
    }

    // Render and return
    const renderedBuffer = await offlineCtx.startRendering();
    return renderedBuffer;
}

/**
 * Convert AudioBuffer to a MediaStream for mixing with video
 */
export function audioBufferToStream(audioCtx, audioBuffer) {
    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    const dest = audioCtx.createMediaStreamDestination();
    source.connect(dest);
    source.start(0);
    return { stream: dest.stream, source };
}

/**
 * Get mood name for a category
 */
export function getMoodName(category) {
    return (moods[category] || moods.motivation).name;
}
