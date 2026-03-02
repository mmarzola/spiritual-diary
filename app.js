/**
 * Spiritual Diary App
 * Self-hosted clone — pure vanilla JS, no dependencies
 */

(function() {
    'use strict';

    // ==================== i18n ====================
    const translations = {
        en: {
            appTitle: 'Spiritual Diary',
            subtitle: 'Paramahansa Yogananda',
            dailyInspiration: 'Daily Inspiration',
            source: 'Source',
            meditationTimer: 'Meditation Timer',
            minutes: 'min',
            start: 'Start',
            pause: 'Pause',
            reset: 'Reset',
            meditating: 'Meditating...',
            paused: 'Paused',
            readyToBegin: 'Ready to begin',
            sessionComplete: 'Session Complete 🙏',
            whereThereIsLight: 'Where There is Light',
            randomPassages: 'Random Passages by Paramahansa Yogananda',
            randomize: 'Randomize',
            passageLength: 'Passage Length:',
            short: 'Short',
            medium: 'Medium',
            long: 'Long',
            home: 'Home',
            repeat: 'Repeat',
            copy: 'Copy',
            copiedToClipboard: 'Copied to clipboard ✓',
            failedToCopy: 'Failed to copy',
            settings: 'Settings',
            language: 'Language'
        },
        pt: {
            appTitle: 'Diário Espiritual',
            subtitle: 'Paramahansa Yogananda',
            dailyInspiration: 'Inspiração Diária',
            source: 'Fonte',
            meditationTimer: 'Cronômetro de Meditação',
            minutes: 'min',
            start: 'Iniciar',
            pause: 'Pausar',
            reset: 'Reiniciar',
            meditating: 'Meditando...',
            paused: 'Pausado',
            readyToBegin: 'Pronto para começar',
            sessionComplete: 'Sessão Completa 🙏',
            whereThereIsLight: 'Onde Há Luz',
            randomPassages: 'Passagens Aleatórias de Paramahansa Yogananda',
            randomize: 'Aleatorizar',
            passageLength: 'Comprimento da Passagem:',
            short: 'Curta',
            medium: 'Média',
            long: 'Longa',
            home: 'Início',
            repeat: 'Repetir',
            copy: 'Copiar',
            copiedToClipboard: 'Copiado para área de transferência ✓',
            failedToCopy: 'Falha ao copiar',
            settings: 'Configurações',
            language: 'Idioma'
        }
    };

    let currentLang = localStorage.getItem('sd-lang') || 'en';

    function t(key) {
        return (translations[currentLang] || translations.en)[key] || key;
    }

    function applyTranslations() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            el.textContent = t(key);
        });
    }

    function setLanguage(lang) {
        currentLang = lang;
        localStorage.setItem('sd-lang', lang);
        applyTranslations();
        updateDiary();
        // Update language button states
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });
    }

    // ==================== Views ====================
    function showView(viewId) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(viewId).classList.add('active');
        window.scrollTo(0, 0);
    }

    // ==================== Diary ====================
    const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    const MONTHS_PT = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    function updateDiary() {
        const now = new Date();
        const monthIndex = now.getMonth();
        const day = now.getDate();
        const monthName = MONTHS_EN[monthIndex];
        const displayMonth = currentLang === 'pt' ? MONTHS_PT[monthIndex] : monthName;

        document.getElementById('diary-date').textContent = `${displayMonth} ${day}`;

        // Get diary entry
        if (typeof DIARY_DATA !== 'undefined' && DIARY_DATA[monthName] && DIARY_DATA[monthName][day]) {
            const entry = DIARY_DATA[monthName][day];
            document.getElementById('diary-theme').textContent = entry.theme;
            document.getElementById('diary-quote').textContent = entry.quote;
            document.getElementById('diary-author').textContent = entry.author;
        }
    }

    // ==================== Meditation Timer ====================
    let timerDuration = 20 * 60; // seconds
    let timerRemaining = timerDuration;
    let timerInterval = null;
    let timerRunning = false;
    let audioCtx = null;
    let ambientOscillator = null;
    let ambientGain = null;

    function formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    function updateTimerDisplay() {
        const display = document.getElementById('timer-display');
        display.textContent = formatTime(timerRemaining);
    }

    function setTimerDuration(minutes) {
        if (timerRunning) return;
        timerDuration = minutes * 60;
        timerRemaining = timerDuration;
        updateTimerDisplay();
        
        // Update button states
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.minutes) === minutes);
        });
        
        document.getElementById('timer-status').textContent = t('readyToBegin');
    }

    function getAudioContext() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        return audioCtx;
    }

    function startAmbientSound() {
        try {
            const ctx = getAudioContext();
            
            // Create a soothing ambient drone
            ambientGain = ctx.createGain();
            ambientGain.gain.setValueAtTime(0, ctx.currentTime);
            ambientGain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 2);
            ambientGain.connect(ctx.destination);

            // Base drone - low Om-like tone
            ambientOscillator = ctx.createOscillator();
            ambientOscillator.type = 'sine';
            ambientOscillator.frequency.setValueAtTime(136.1, ctx.currentTime); // Om frequency
            ambientOscillator.connect(ambientGain);
            ambientOscillator.start();

            // Add subtle harmonics
            const harm1 = ctx.createOscillator();
            harm1.type = 'sine';
            harm1.frequency.setValueAtTime(272.2, ctx.currentTime);
            const harm1Gain = ctx.createGain();
            harm1Gain.gain.setValueAtTime(0.02, ctx.currentTime);
            harm1.connect(harm1Gain);
            harm1Gain.connect(ctx.destination);
            harm1.start();
            
            // Store for cleanup
            ambientOscillator._harmonics = [harm1, harm1Gain];
        } catch (e) {
            console.log('Audio not available:', e);
        }
    }

    function stopAmbientSound() {
        try {
            if (ambientGain) {
                const ctx = getAudioContext();
                ambientGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);
                setTimeout(() => {
                    try {
                        if (ambientOscillator) {
                            ambientOscillator.stop();
                            if (ambientOscillator._harmonics) {
                                ambientOscillator._harmonics[0].stop();
                            }
                        }
                    } catch(e) {}
                    ambientOscillator = null;
                    ambientGain = null;
                }, 1200);
            }
        } catch(e) {}
    }

    function playBell() {
        try {
            const ctx = getAudioContext();
            const duration = 4;
            
            // Bell tone
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(528, ctx.currentTime); // Solfeggio frequency
            
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + duration);
            
            // Second bell (slightly delayed, lower)
            setTimeout(() => {
                const osc2 = ctx.createOscillator();
                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(396, ctx.currentTime);
                const gain2 = ctx.createGain();
                gain2.gain.setValueAtTime(0.2, ctx.currentTime);
                gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3);
                osc2.connect(gain2);
                gain2.connect(ctx.destination);
                osc2.start();
                osc2.stop(ctx.currentTime + 3);
            }, 800);
        } catch(e) {
            console.log('Bell audio not available:', e);
        }
    }

    function startTimer() {
        if (timerRemaining <= 0) return;
        timerRunning = true;
        
        document.getElementById('timer-start').style.display = 'none';
        document.getElementById('timer-pause').style.display = '';
        document.getElementById('timer-display').classList.add('running');
        document.getElementById('timer-status').textContent = t('meditating');
        
        startAmbientSound();
        
        timerInterval = setInterval(() => {
            timerRemaining--;
            updateTimerDisplay();
            
            if (timerRemaining <= 0) {
                clearInterval(timerInterval);
                timerInterval = null;
                timerRunning = false;
                stopAmbientSound();
                playBell();
                
                document.getElementById('timer-start').style.display = '';
                document.getElementById('timer-pause').style.display = 'none';
                document.getElementById('timer-display').classList.remove('running');
                document.getElementById('timer-status').textContent = t('sessionComplete');
            }
        }, 1000);
    }

    function pauseTimer() {
        clearInterval(timerInterval);
        timerInterval = null;
        timerRunning = false;
        stopAmbientSound();
        
        document.getElementById('timer-start').style.display = '';
        document.getElementById('timer-pause').style.display = 'none';
        document.getElementById('timer-display').classList.remove('running');
        document.getElementById('timer-status').textContent = t('paused');
    }

    function resetTimer() {
        clearInterval(timerInterval);
        timerInterval = null;
        timerRunning = false;
        timerRemaining = timerDuration;
        stopAmbientSound();
        updateTimerDisplay();
        
        document.getElementById('timer-start').style.display = '';
        document.getElementById('timer-pause').style.display = 'none';
        document.getElementById('timer-display').classList.remove('running');
        document.getElementById('timer-status').textContent = t('readyToBegin');
    }

    // ==================== Passages ====================
    let currentPassage = null;

    function getSelectedLength() {
        const checked = document.querySelector('input[name="length"]:checked');
        return checked ? checked.value : 'medium';
    }

    function getRandomPassage(length) {
        if (typeof PASSAGES_DATA === 'undefined') return null;
        
        // Target word counts (2x bigger than original averages)
        // Original: short ~24, medium ~57, long ~124
        // New targets: short ~54, medium ~130, long ~280+
        const wordRanges = {
            'short': { min: 40, max: 80 },      // ~54 words
            'medium': { min: 80, max: 180 },    // ~130 words
            'long': { min: 150, max: 999 }      // ~280+ words
        };
        
        const range = wordRanges[length] || wordRanges['medium'];
        let filtered = PASSAGES_DATA.filter(p => p.words >= range.min && p.words <= range.max);
        
        // For "long", also try combining passages if not enough big ones
        if (length === 'long' && (filtered.length < 10 || Math.random() > 0.6)) {
            const mediums = PASSAGES_DATA.filter(p => p.words >= 40 && p.words <= 80);
            if (mediums.length >= 2) {
                const idx1 = Math.floor(Math.random() * mediums.length);
                let idx2 = Math.floor(Math.random() * mediums.length);
                while (idx2 === idx1) idx2 = Math.floor(Math.random() * mediums.length);
                
                return {
                    text: mediums[idx1].text + '\n\n' + mediums[idx2].text,
                    length: 'long',
                    words: mediums[idx1].words + mediums[idx2].words
                };
            }
        }
        
        // Fallback: expand range if too few results
        if (filtered.length < 5) {
            filtered = PASSAGES_DATA.filter(p => p.words >= range.min * 0.7);
        }
        if (filtered.length === 0) {
            filtered = PASSAGES_DATA;
        }
        
        const idx = Math.floor(Math.random() * filtered.length);
        return filtered[idx];
    }

    /**
     * Clean up a passage to ensure it starts and ends with complete sentences.
     * - If it starts mid-sentence (lowercase or no capital), trim to first sentence start
     * - If it ends mid-sentence (no period/!/? at end), trim to last sentence end
     */
    function cleanupPassageText(text) {
        if (!text) return text;
        
        let cleaned = text.trim();
        
        // Sentence-ending punctuation
        const sentenceEnders = /[.!?]["']?\s*/;
        const sentenceEndChars = /[.!?]["']?$/;
        
        // Check if starts mid-sentence (first char is lowercase, or doesn't look like sentence start)
        // A proper sentence start: capital letter, quote+capital, or number
        const startsWithSentence = /^["']?[A-Z0-9]/.test(cleaned);
        
        if (!startsWithSentence) {
            // Find first sentence boundary (period/!/? followed by space and capital)
            const match = cleaned.match(/[.!?]["']?\s+["']?[A-Z]/);
            if (match) {
                const idx = match.index + match[0].length - 1;
                cleaned = cleaned.slice(idx).trim();
            }
        }
        
        // Check if ends with complete sentence
        const endsWithSentence = sentenceEndChars.test(cleaned);
        
        if (!endsWithSentence) {
            // Find last sentence-ending punctuation
            let lastEnd = -1;
            const endings = [...cleaned.matchAll(/[.!?]["']?/g)];
            if (endings.length > 0) {
                const lastMatch = endings[endings.length - 1];
                lastEnd = lastMatch.index + lastMatch[0].length;
            }
            
            if (lastEnd > 0) {
                cleaned = cleaned.slice(0, lastEnd).trim();
            }
        }
        
        // If cleaning removed too much (less than 20 chars), return original
        if (cleaned.length < 20) {
            return text.trim();
        }
        
        return cleaned;
    }

    function showPassage(passage) {
        if (!passage) return;
        // Create a cleaned version of the passage
        currentPassage = {
            ...passage,
            text: cleanupPassageText(passage.text)
        };
        document.getElementById('passage-text').textContent = currentPassage.text;
        showView('passage-view');
    }

    function copyPassage() {
        if (!currentPassage) return;
        
        const text = currentPassage.text + '\n\n— Paramahansa Yogananda\n(From "Where There is Light")';
        
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                showToast(t('copiedToClipboard'));
            }).catch(() => {
                fallbackCopy(text);
            });
        } else {
            fallbackCopy(text);
        }
    }

    function fallbackCopy(text) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;left:-9999px';
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand('copy');
            showToast(t('copiedToClipboard'));
        } catch(e) {
            showToast(t('failedToCopy'));
        }
        document.body.removeChild(ta);
    }

    // ==================== Ambient Music Toggle ====================
    let musicPlaying = false;
    let musicOscillators = [];

    function toggleMusic() {
        const btn = document.getElementById('music-toggle');
        
        if (musicPlaying) {
            stopMusic();
            btn.classList.remove('playing');
        } else {
            startMusic();
            btn.classList.add('playing');
        }
        musicPlaying = !musicPlaying;
    }

    function startMusic() {
        try {
            const ctx = getAudioContext();
            
            // Create layered ambient sounds
            const frequencies = [
                { freq: 136.1, gain: 0.04, type: 'sine' },    // Om
                { freq: 272.2, gain: 0.015, type: 'sine' },   // Harmonic
                { freq: 174, gain: 0.02, type: 'sine' },      // Solfeggio
                { freq: 396, gain: 0.008, type: 'sine' },     // Liberation
            ];
            
            frequencies.forEach(f => {
                const osc = ctx.createOscillator();
                osc.type = f.type;
                osc.frequency.setValueAtTime(f.freq, ctx.currentTime);
                
                const gain = ctx.createGain();
                gain.gain.setValueAtTime(0, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(f.gain, ctx.currentTime + 3);
                
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                
                musicOscillators.push({ osc, gain });
            });
            
            // Add gentle LFO for movement
            const lfo = ctx.createOscillator();
            lfo.frequency.setValueAtTime(0.1, ctx.currentTime);
            const lfoGain = ctx.createGain();
            lfoGain.gain.setValueAtTime(2, ctx.currentTime);
            lfo.connect(lfoGain);
            if (musicOscillators.length > 0) {
                lfoGain.connect(musicOscillators[0].osc.frequency);
            }
            lfo.start();
            musicOscillators.push({ osc: lfo, gain: lfoGain });
            
        } catch(e) {
            console.log('Music not available:', e);
        }
    }

    function stopMusic() {
        try {
            const ctx = getAudioContext();
            musicOscillators.forEach(({ osc, gain }) => {
                try {
                    if (gain && gain.gain) {
                        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
                    }
                    setTimeout(() => {
                        try { osc.stop(); } catch(e) {}
                    }, 2000);
                } catch(e) {}
            });
            musicOscillators = [];
        } catch(e) {}
    }

    // ==================== Toast ====================
    let toastTimeout = null;

    function showToast(message) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.add('show');
        
        if (toastTimeout) clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 2500);
    }

    // ==================== Init ====================
    function init() {
        // Apply saved language
        applyTranslations();
        
        // Update language buttons
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === currentLang);
        });

        // Load diary
        updateDiary();

        // Timer display
        updateTimerDisplay();

        // ---- Event Listeners ----

        // Music toggle
        document.getElementById('music-toggle').addEventListener('click', toggleMusic);

        // Settings
        document.getElementById('settings-btn').addEventListener('click', () => showView('settings-view'));
        document.getElementById('settings-back').addEventListener('click', () => showView('main-view'));

        // Language
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
        });

        // Timer presets
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => setTimerDuration(parseInt(btn.dataset.minutes)));
        });

        // Timer controls
        document.getElementById('timer-start').addEventListener('click', startTimer);
        document.getElementById('timer-pause').addEventListener('click', pauseTimer);
        document.getElementById('timer-reset').addEventListener('click', resetTimer);

        // Randomize passage
        document.getElementById('randomize-btn').addEventListener('click', () => {
            const length = getSelectedLength();
            const passage = getRandomPassage(length);
            if (passage) showPassage(passage);
        });

        // Passage view controls
        document.getElementById('passage-home').addEventListener('click', () => showView('main-view'));
        document.getElementById('passage-repeat').addEventListener('click', () => {
            if (currentPassage) {
                // Re-display with animation
                const el = document.getElementById('passage-text');
                el.style.opacity = '0';
                setTimeout(() => {
                    el.textContent = currentPassage.text;
                    el.style.opacity = '1';
                }, 200);
            }
        });
        document.getElementById('passage-copy').addEventListener('click', copyPassage);
        document.getElementById('passage-new').addEventListener('click', () => {
            const length = getSelectedLength();
            const passage = getRandomPassage(length);
            if (passage) {
                // Clean up the passage text for complete sentences
                currentPassage = {
                    ...passage,
                    text: cleanupPassageText(passage.text)
                };
                const el = document.getElementById('passage-text');
                el.style.opacity = '0';
                el.style.transition = 'opacity 0.3s';
                setTimeout(() => {
                    el.textContent = currentPassage.text;
                    el.style.opacity = '1';
                }, 200);
            }
        });

        // Passage text transition
        document.getElementById('passage-text').style.transition = 'opacity 0.3s';

        console.log('🙏 Spiritual Diary initialized');
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
