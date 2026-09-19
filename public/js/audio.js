let audioCtx = null;
let bgmAudioBuffer = null;
let bgmSourceNode = null;
let bgmGainNode = null;
let isBgmPlaying = false;
let volumeFluctuationInterval = null;

function ensureAudioUnlocked() {
  try {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  } catch (e) {}
}

async function prepareSeamlessBuffer(url, crossfadeSeconds = 1.2) {
  ensureAudioUnlocked();
  const response = await fetch(url);
  const rawData = await response.arrayBuffer();
  const decoded = await audioCtx.decodeAudioData(rawData);

  const sampleRate = decoded.sampleRate;
  const fadeSamples = Math.min(Math.floor(crossfadeSeconds * sampleRate), Math.floor(decoded.length / 4));
  const loopLength = decoded.length - fadeSamples;

  // Create new buffer shortened by the fade duration
  const seamlessBuffer = audioCtx.createBuffer(
    decoded.numberOfChannels,
    loopLength,
    sampleRate
  );

  for (let channel = 0; channel < decoded.numberOfChannels; channel++) {
    const inputData = decoded.getChannelData(channel);
    const outputData = seamlessBuffer.getChannelData(channel);

    // Copy main body
    outputData.set(inputData.subarray(0, loopLength));

    // Overlap the tail into the beginning using an equal-power crossfade
    for (let i = 0; i < fadeSamples; i++) {
      const tailSample = inputData[loopLength + i];
      const headSample = outputData[i];
      const progress = i / fadeSamples; // 0 to 1

      // Smooth cosine crossfade
      const fadeIn = Math.sin((progress * Math.PI) / 2);
      const fadeOut = Math.cos((progress * Math.PI) / 2);

      outputData[i] = headSample * fadeIn + tailSample * fadeOut;
    }
  }

  return seamlessBuffer;
}

async function initBgmNodes() {
  if (bgmSourceNode) return;
  ensureAudioUnlocked();
  if (!audioCtx) return;

  const audioElement = document.getElementById('bgm-audio');
  const audioSrc = audioElement ? (audioElement.src || audioElement.querySelector('source')?.src) : 'music.mp3';

  if (!bgmAudioBuffer) {
    try {
      bgmAudioBuffer = await prepareSeamlessBuffer(audioSrc, 1.2);
    } catch (err) {
      console.warn("Failed to load buffer:", err);
      return;
    }
  }

  if (!bgmGainNode) {
    bgmGainNode = audioCtx.createGain();
    bgmGainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    bgmGainNode.connect(audioCtx.destination);
  }
}

function triggerVolumeSwell() {
  if (!isBgmPlaying) return;

  const isSwellHigh = Math.random() > 0.5;
  const targetVolume = isSwellHigh 
    ? 0.05 + Math.random() * 0.03
    : 0.075 + Math.random() * 0.02;

  if (bgmGainNode && audioCtx) {
    const rampDuration = 2.5 + Math.random() * 1.5;
    bgmGainNode.gain.cancelScheduledValues(audioCtx.currentTime);
    bgmGainNode.gain.linearRampToValueAtTime(targetVolume, audioCtx.currentTime + rampDuration);
  }
}

async function toggleBGM() {
  ensureAudioUnlocked();
  const btn = document.getElementById('bgm-btn-text');

  if (!isBgmPlaying) {
    await initBgmNodes();
    if (!bgmAudioBuffer) return;

    // Create a native sample-accurate looping source node
    bgmSourceNode = audioCtx.createBufferSource();
    bgmSourceNode.buffer = bgmAudioBuffer;
    bgmSourceNode.loop = true; // Perfect hardware loop
    bgmSourceNode.connect(bgmGainNode);
    bgmSourceNode.start(0);

    isBgmPlaying = true;
    if (btn) btn.innerText = typeof t === 'function' ? t('bgmOn') : 'BGM On';

    triggerVolumeSwell();
    if (!volumeFluctuationInterval) {
      volumeFluctuationInterval = setInterval(triggerVolumeSwell, 5000);
    }
  } else {
    if (bgmSourceNode) {
      bgmSourceNode.stop();
      bgmSourceNode.disconnect();
      bgmSourceNode = null;
    }

    isBgmPlaying = false;
    if (btn) btn.innerText = typeof t === 'function' ? t('bgmOff') : 'BGM Off';

    if (volumeFluctuationInterval) {
      clearInterval(volumeFluctuationInterval);
      volumeFluctuationInterval = null;
    }
  }
}

window.addEventListener('click', ensureAudioUnlocked, { passive: true });
window.addEventListener('touchstart', ensureAudioUnlocked, { passive: true });

function playClockTick(timeLeft) {
  try {
    ensureAudioUnlocked();
    if (!audioCtx) return;

    const isUrgent = timeLeft <= 10;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = isUrgent ? 'sawtooth' : 'sine';
    osc.frequency.setValueAtTime(isUrgent ? 880 : 440, audioCtx.currentTime);

    const volume = isUrgent ? 0.35 : 0.08;
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + (isUrgent ? 0.12 : 0.05));

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + (isUrgent ? 0.13 : 0.06));
  } catch (e) {}
}

function playEventAlertSound() {
  try {
    ensureAudioUnlocked();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;

    const kickOsc = audioCtx.createOscillator();
    const kickGain = audioCtx.createGain();
    kickOsc.type = 'sawtooth';
    kickOsc.frequency.setValueAtTime(160, now);
    kickOsc.frequency.exponentialRampToValueAtTime(32, now + 0.35);

    kickGain.gain.setValueAtTime(0.55, now);
    kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    kickOsc.connect(kickGain);
    kickGain.connect(audioCtx.destination);
    kickOsc.start(now);
    kickOsc.stop(now + 0.4);

    [0.08, 0.28].forEach((offset) => {
      const sirenOsc = audioCtx.createOscillator();
      const sirenGain = audioCtx.createGain();

      sirenOsc.type = 'sawtooth';
      sirenOsc.frequency.setValueAtTime(620, now + offset);
      sirenOsc.frequency.exponentialRampToValueAtTime(1380, now + offset + 0.14);

      sirenGain.gain.setValueAtTime(0.32, now + offset);
      sirenGain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.17);

      sirenOsc.connect(sirenGain);
      sirenGain.connect(audioCtx.destination);
      sirenOsc.start(now + offset);
      sirenOsc.stop(now + offset + 0.18);
    });

    const droneOsc = audioCtx.createOscillator();
    const droneGain = audioCtx.createGain();
    droneOsc.type = 'triangle';
    droneOsc.frequency.setValueAtTime(110, now + 0.05);
    droneOsc.frequency.linearRampToValueAtTime(130, now + 0.35);

    droneGain.gain.setValueAtTime(0.3, now + 0.05);
    droneGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    droneOsc.connect(droneGain);
    droneGain.connect(audioCtx.destination);
    droneOsc.start(now + 0.05);
    droneOsc.stop(now + 0.46);
  } catch (e) {}
}

function playEventOverSound() {
  try {
    ensureAudioUnlocked();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;

    const subOsc = audioCtx.createOscillator();
    const subGain = audioCtx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(180, now);
    subOsc.frequency.exponentialRampToValueAtTime(45, now + 0.5);

    subGain.gain.setValueAtTime(0.45, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    subOsc.connect(subGain);
    subGain.connect(audioCtx.destination);
    subOsc.start(now);
    subOsc.stop(now + 0.56);

    [0.15, 0.32].forEach((offset, idx) => {
      const radioOsc = audioCtx.createOscillator();
      const radioGain = audioCtx.createGain();
      const pitch = idx === 0 ? 987.77 : 1318.51;

      radioOsc.type = 'square';
      radioOsc.frequency.setValueAtTime(pitch, now + offset);

      radioGain.gain.setValueAtTime(0.12, now + offset);
      radioGain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.06);

      radioOsc.connect(radioGain);
      radioGain.connect(audioCtx.destination);
      radioOsc.start(now + offset);
      radioOsc.stop(now + offset + 0.07);
    });
  } catch (e) {}
}