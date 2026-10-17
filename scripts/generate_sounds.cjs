const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const OUTPUT_DIR = path.join(__dirname, '../public/sounds');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function createWavHeader(dataLength, sampleRate = 44100, numChannels = 1) {
  const buffer = Buffer.alloc(44);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * numChannels * 2, 28);
  buffer.writeUInt16LE(numChannels * 2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataLength, 40);
  return buffer;
}

function generateTrack(filename, duration, options) {
  const sampleRate = 44100;
  const totalSamples = sampleRate * duration;
  const pcm = Buffer.alloc(totalSamples * 2);

  const {
    tempo = 120,
    bassFreq = 55,
    melodyNotes = [261.63, 329.63, 392.00, 523.25],
    style = 'melody',
    dholak = false,
  } = options;

  const beatsPerSec = tempo / 60;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const beat = t * beatsPerSec;
    const beatFract = beat % 1;

    let kick = 0;
    let snare = 0;
    let bass = 0;
    let melody = 0;

    if (style === 'bhojpuri' || dholak) {
      // Dholak / Bhojpuri syncopated beat: Dha Dha Ge Na, Ta Ta Ke Na
      const subBeat = (beat * 2) % 1;
      // Dholak bass punch (Gha)
      if (Math.floor(beat * 2) % 2 === 0) {
        kick = Math.exp(-subBeat * 14) * Math.sin(2 * Math.PI * (bassFreq + 20) * subBeat);
      }
      // Dholak slap/chatt (Ta)
      if (Math.floor(beat * 2) % 2 === 1 || beatFract > 0.7) {
        snare = Math.exp(-subBeat * 24) * ((Math.random() * 2 - 1) * 0.45);
      }
      // Folk Harmonium / Shehnai melody
      const noteIdx = Math.floor(beat * 2) % melodyNotes.length;
      const freq = melodyNotes[noteIdx];
      const noteFract = (beat * 2) % 1;
      melody = Math.exp(-noteFract * 3.5) * (
        0.6 * Math.sin(2 * Math.PI * freq * t) +
        0.3 * Math.sin(4 * Math.PI * freq * t) +
        0.15 * Math.sin(6 * Math.PI * freq * t)
      );
      // Continuous drone/tanpura
      bass = 0.2 * Math.sin(2 * Math.PI * (bassFreq * 1.5) * t);
    } else if (style === 'romantic') {
      // Soft gentle acoustic / piano chords & warm bass
      const subBeat = beatFract;
      kick = (Math.floor(beat) % 2 === 0) ? Math.exp(-subBeat * 8) * Math.sin(2 * Math.PI * 50 * subBeat) * 0.35 : 0;
      snare = (Math.floor(beat) % 2 === 1) ? Math.exp(-subBeat * 15) * ((Math.random() * 2 - 1) * 0.15) : 0;

      // Romantic melody with reverb-like harmonics
      const noteIdx = Math.floor(beat) % melodyNotes.length;
      const freq = melodyNotes[noteIdx];
      const noteFract = beat % 1;
      melody = Math.exp(-noteFract * 2.5) * (
        0.7 * Math.sin(2 * Math.PI * freq * t) +
        0.25 * Math.sin(3 * Math.PI * freq * t)
      );
      bass = 0.25 * Math.sin(2 * Math.PI * (bassFreq) * t);
    } else if (style === 'party') {
      // Modern Punjabi/Bollywood dance EDM punch
      kick = Math.exp(-beatFract * 16) * Math.sin(2 * Math.PI * (75 - beatFract * 25) * beatFract) * 0.8;
      snare = (Math.floor(beat) % 2 === 1) ? Math.exp(-beatFract * 22) * ((Math.random() * 2 - 1) * 0.5) : 0;
      
      const noteIdx = Math.floor(beat * 4) % melodyNotes.length;
      const freq = melodyNotes[noteIdx];
      const noteFract = (beat * 4) % 1;
      melody = Math.exp(-noteFract * 5) * (
        0.5 * (Math.sin(2 * Math.PI * freq * t) > 0 ? 1 : -1) * 0.3 + // square pluck
        0.5 * Math.sin(2 * Math.PI * freq * t)
      );
      bass = 0.4 * Math.sin(2 * Math.PI * bassFreq * t);
    } else if (style === 'dialogue') {
      // Suspense / Cinematic background score
      const slowBeat = (t * 0.8) % 1;
      bass = 0.45 * Math.sin(2 * Math.PI * (45 + Math.sin(t * 1.2) * 5) * t);
      // Subtle strings swell
      const chordIdx = Math.floor(t / 4) % 3;
      const chordFreqs = [
        [220, 261.63, 329.63],
        [174.61, 220, 261.63],
        [196, 246.94, 293.66],
      ][chordIdx];
      melody = 0.2 * (
        Math.sin(2 * Math.PI * chordFreqs[0] * t) +
        Math.sin(2 * Math.PI * chordFreqs[1] * t) +
        Math.sin(2 * Math.PI * chordFreqs[2] * t)
      );
      // Occasional sub-impact
      if (Math.floor(t % 4) === 0 && (t % 1) < 0.3) {
        kick = Math.exp(-(t % 1) * 8) * Math.sin(2 * Math.PI * 40 * (t % 1)) * 0.6;
      }
    }

    const sample = Math.max(-0.95, Math.min(0.95, kick + snare + bass + melody));
    pcm.writeInt16LE(Math.floor(sample * 32767), i * 2);
  }

  const wavPath = path.join('/tmp', `${filename}.wav`);
  const mp3Path = path.join(OUTPUT_DIR, `${filename}.mp3`);
  const wavHeader = createWavHeader(pcm.length, sampleRate, 1);
  fs.writeFileSync(wavPath, Buffer.concat([wavHeader, pcm]));

  execSync(`ffmpeg -y -i "${wavPath}" -codec:a libmp3lame -b:a 128k -ar 44100 "${mp3Path}"`);
  try { fs.unlinkSync(wavPath); } catch {}
  console.log(`Generated: ${mp3Path}`);
}

// Generate Bhojpuri Tracks
generateTrack('bhojpuri_kamariya_remix', 20, {
  tempo: 135,
  bassFreq: 58,
  melodyNotes: [293.66, 329.63, 370.0, 440.0, 493.88, 587.33], // D E F# A B
  style: 'bhojpuri',
});

generateTrack('bhojpuri_lollipop_dholak', 18, {
  tempo: 140,
  bassFreq: 65,
  melodyNotes: [261.63, 293.66, 329.63, 392.00, 440.00, 523.25],
  style: 'bhojpuri',
  dholak: true,
});

generateTrack('bhojpuri_raja_ji_dance', 22, {
  tempo: 132,
  bassFreq: 52,
  melodyNotes: [220, 261.63, 293.66, 329.63, 392, 440],
  style: 'bhojpuri',
  dholak: true,
});

// Generate Hindi Tracks
generateTrack('hindi_tum_hi_ho_flute', 24, {
  tempo: 84,
  bassFreq: 55,
  melodyNotes: [220, 246.94, 261.63, 293.66, 329.63, 349.23, 392],
  style: 'romantic',
});

generateTrack('hindi_kesariya_melody', 20, {
  tempo: 96,
  bassFreq: 65,
  melodyNotes: [261.63, 293.66, 329.63, 392, 440, 523.25],
  style: 'romantic',
});

generateTrack('hindi_party_kala_chashma', 18, {
  tempo: 130,
  bassFreq: 60,
  melodyNotes: [261.63, 311.13, 349.23, 392.0, 466.16],
  style: 'party',
});

// Generate Dialogue Background Scores
generateTrack('dialogue_pushpa_swag', 16, {
  tempo: 90,
  bassFreq: 45,
  melodyNotes: [196, 220, 246.94, 261.63, 293.66],
  style: 'dialogue',
});

generateTrack('dialogue_salman_commitment', 15, {
  tempo: 95,
  bassFreq: 48,
  melodyNotes: [220, 261.63, 329.63, 392],
  style: 'dialogue',
});

generateTrack('dialogue_baburao_comedy', 14, {
  tempo: 125,
  bassFreq: 62,
  melodyNotes: [261.63, 329.63, 392, 523.25],
  style: 'party',
});

console.log('All audio sound tracks generated successfully!');
