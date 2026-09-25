const birthdayTime = Date.parse('2026-09-26T00:00:00+05:00');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let birthdayTimeline;
let song;
let confettiTimer;
let eggTimer;
let unlocked = false;
const $ = selector => document.querySelector(selector);

// The midnight gate is presentation only; the device clock supplies the time.
document.addEventListener('DOMContentLoaded', () => {
    song = $('.song');
    $('#music-control').addEventListener('click', () => {
        if (song.paused) playMusic(); else song.pause();
    });
    song.addEventListener('play', updateMusicControl);
    song.addEventListener('pause', updateMusicControl);
    $('#skip').addEventListener('click', () => {
        if (!birthdayTimeline) return;
        birthdayTimeline.seek('celebration', true).play();
        setParticles(false);
        window.scrollTo(0, 0);
    });
    $('#replay').addEventListener('click', replay);
    setupLightbox();
    let taps = 0;
    $('#affection').addEventListener('click', () => {
        if (++taps % 3) return;
        $('#egg-message').hidden = false;
        clearTimeout(eggTimer);
        eggTimer = setTimeout(() => { $('#egg-message').hidden = true; }, 3000);
    });
    const alreadyBirthday = Date.now() >= birthdayTime;
    const tick = () => {
        const remaining = Math.max(0, birthdayTime - Date.now());
        const seconds = Math.ceil(remaining / 1000);
        const values = [Math.floor(seconds / 86400), Math.floor(seconds / 3600) % 24, Math.floor(seconds / 60) % 60, seconds % 60];
        ['days', 'hours', 'minutes', 'seconds'].forEach((id, index) => {
            document.getElementById(id).textContent = String(values[index]).padStart(2, '0');
        });
        if (!remaining) { unlockBirthday(alreadyBirthday); return; }
        setTimeout(tick, Math.min(250, remaining));
    };
    tick();
});

function unlockBirthday(immediate = false) {
    if (unlocked) return;
    unlocked = true;
    const countdown = $('#countdown');
    countdown.classList.add('leaving');
    if (!immediate) {
        countdown.classList.add('midnight-glow');
        burstConfetti();
    }
    setTimeout(() => {
        countdown.hidden = true;
        $('.container').hidden = false;
        $('.container').inert = false;
        startBirthdaySurprise();
    }, immediate || reducedMotion ? 0 : 900);
}

function updateMusicControl() {
    $('#music-control').textContent = song.paused ? 'Play music ♫' : 'Pause music ♫';
    $('#music-control').setAttribute('aria-pressed', String(!song.paused));
}
async function playMusic() {
    try { await song.play(); } catch (_) { song.pause(); }
    updateMusicControl();
}
async function startBirthdaySurprise() {
    let wantsMusic = false;
    if (window.Swal) {
        try {
            const result = await Swal.fire({
                title: 'Do you want to play music in the background?',
                icon: 'question', showCancelButton: true,
                confirmButtonColor: '#e65792', cancelButtonColor: '#777',
                confirmButtonText: 'Yes', cancelButtonText: 'No',
                allowOutsideClick: false, allowEscapeKey: false
            });
            wantsMusic = result.isConfirmed;
        } catch (_) { wantsMusic = window.confirm('Do you want to play music in the background?'); }
    } else {
        wantsMusic = window.confirm('Do you want to play music in the background?');
    }
    // Invoke playback in the choice handler; never wait on a slow media download.
    if (wantsMusic) playMusic(); else song.pause();
    $('.presentation-controls').hidden = false;
    if (window.gsap) {
        try { animationTimeline(); } catch (_) { showStaticBirthday(); }
    } else showStaticBirthday();
}

function splitGraphemes(element) {
    const text = element.textContent;
    // With no Segmenter, reveal the whole string: never separate emoji sequences.
    const characters = typeof Intl.Segmenter === 'function'
        ? Array.from(new Intl.Segmenter(undefined, {granularity: 'grapheme'}).segment(text), part => part.segment)
        : [text];
    element.setAttribute('aria-label', text);
    element.replaceChildren();
    for (const character of characters) {
        const span = document.createElement('span');
        span.textContent = character;
        span.setAttribute('aria-hidden', 'true');
        element.appendChild(span);
    }
}

function showStaticBirthday() {
    birthdayTimeline?.kill();
    birthdayTimeline = null;
    setParticles(false);
    clearConfetti();
    $('.container').classList.add('static-presentation');
    $('.container').querySelectorAll('[style]').forEach(element => element.removeAttribute('style'));
    $('#skip').hidden = true;
    $('#progress').hidden = true;
}

function replay() {
    // Closing must not resume the previous playback state during reset.
    if ($('#lightbox').open) $('#lightbox').close();
    clearConfetti();
    setParticles(false);
    $('#egg-message').hidden = true;
    if (!song.paused) song.currentTime = 0;
    window.scrollTo(0, 0);
    if (birthdayTimeline) {
        $('#skip').hidden = false;
        birthdayTimeline.restart();
    }
}

function setupLightbox() {
    const dialog = $('#lightbox');
    let wasPlaying = false;
    let opener;
    document.querySelectorAll('.photo-button').forEach(button => {
        button.addEventListener('click', () => {
            opener = button;
            const source = button.querySelector('img');
            dialog.querySelector('img').src = source.src;
            dialog.querySelector('img').alt = source.alt;
            wasPlaying = Boolean(birthdayTimeline && !birthdayTimeline.paused() && birthdayTimeline.progress() < 1);
            if (wasPlaying) birthdayTimeline.pause();
            dialog.showModal();
        });
    });
    $('#close-lightbox').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
    // Native dialog handles Escape, focus trapping, and touch activation.
    dialog.addEventListener('close', () => {
        if (wasPlaying) birthdayTimeline?.play();
        wasPlaying = false;
        opener?.focus({preventScroll: true});
    });
}

function clearConfetti() {
    clearTimeout(confettiTimer);
    document.querySelector('.confetti')?.remove();
}
function burstConfetti() {
    clearConfetti();
    if (reducedMotion) return;
    const layer = document.createElement('div');
    layer.className = 'confetti';
    layer.setAttribute('aria-hidden', 'true');
    const colors = ['#ff69b4', '#bd6ecf', '#7dd175', '#f4c95d', '#349d8b'];
    for (let i = 0; i < 45; i++) {
        const piece = document.createElement('i');
        piece.style.left = `${Math.random() * 100}%`;
        piece.style.background = colors[i % colors.length];
        piece.style.animationDelay = `${Math.random() * 0.6}s`;
        layer.appendChild(piece);
    }
    document.body.appendChild(layer);
    confettiTimer = setTimeout(clearConfetti, 4500);
}
function setParticles(active) {
    const layer = $('#particles');
    if (!active || reducedMotion) { layer.replaceChildren(); return; }
    if (layer.childElementCount) return;
    for (let i = 0; i < 8; i++) {
        const particle = document.createElement('span');
        particle.textContent = i % 2 ? '♡' : '✧';
        particle.style.left = `${5 + i * 12}%`;
        particle.style.animationDelay = `${-i * 1.4}s`;
        layer.appendChild(particle);
    }
}

// Keep one seekable GSAP timeline. Scene visibility is timeline state, so Skip
// and Replay produce the same result as normal playback, without new listeners.
function animationTimeline() {
    splitGraphemes($('#name'));
    splitGraphemes($('.hbd-chatbox'));
    splitGraphemes($('.wish-hbd'));
    const duration = reducedMotion ? 0.15 : 0.6;
    const rise = reducedMotion ? 0 : 16;
    const scenes = '.container > div:not(.seven):not(.eight)';
    const tl = gsap.timeline({paused: true, onUpdate: () => {
        $('#progress').value = tl.progress();
        const t = tl.time();
        setParticles(t >= tl.labels.emotional && t < tl.labels.celebration);
    }});
    birthdayTimeline = tl;
    $('#progress').hidden = false;
    const enter = selector => {
        tl.set(selector, {display: 'block'})
          .fromTo(selector, {autoAlpha: 0, y: rise}, {autoAlpha: 1, y: 0, duration, immediateRender: false});
    };
    const leave = (selector, hold) => {
        tl.to(selector, {autoAlpha: 0, duration}, `+=${hold}`).set(selector, {display: 'none'});
    };
    tl.set('.container', {visibility: 'visible'})
      .set(scenes, {display: 'none', autoAlpha: 0, y: 0})
      .set('#skip', {display: 'block'})
      .set('#affection, .final-note, .one-more, .age-note, .memory p, .poem p', {autoAlpha: 0})
      .set('#name', {autoAlpha: 1})
      .set('.hbd-chatbox span', {visibility: 'hidden'})
      .set('.baloons img, .eight svg', {autoAlpha: 0});
    enter('.container > .one');
    tl.fromTo('#name span', {autoAlpha: 0}, {autoAlpha: 1, duration: 0.1, stagger: reducedMotion ? 0 : 0.12, immediateRender: false})
      .to('#name', {autoAlpha: 0, duration}, '+=1')
      .to('#affection', {autoAlpha: 1, duration});
    leave('.container > .one', 4);
    enter('.three');
    leave('.three', 3);
    // Retain the existing short birthday sentiments before the personal letter.
    tl.set('.five p', {autoAlpha: 0});
    enter('.five');
    for (const selector of ['.idea-1', '.idea-2', '.idea-3', '.idea-4', '.idea-7', '.idea-5', '.idea-6']) {
        tl.to(selector, {autoAlpha: 1, duration}).to(selector, {autoAlpha: 0, duration}, '+=1.2');
    }
    leave('.five', 0);
    tl.addLabel('emotional');
    enter('.four');
    tl.to('.hbd-chatbox span', {visibility: 'visible', duration: 0, stagger: reducedMotion ? 0 : 0.018});
    // Reading time is independent of motion preference. Native document scrolling
    // keeps every paragraph accessible; Skip is available throughout this hold.
    leave('.four', 125);
    tl.call(() => window.scrollTo(0, 0));
    enter('.memory');
    tl.to('.memory .years', {autoAlpha: 1, duration})
      .to('.memory p:last-child', {autoAlpha: 1, duration}, '+=1');
    leave('.memory', 5);
    enter('.poem');
    tl.fromTo('.poem p', {autoAlpha: 0, y: rise}, {
        autoAlpha: 1, y: 0, duration, stagger: reducedMotion ? 0.2 : 1.3, immediateRender: false
    });
    leave('.poem', 7);
    enter('.age');
    tl.fromTo('.age-number', {scale: reducedMotion ? 1 : 0.8}, {scale: 1, duration, immediateRender: false})
      .to('.age-note', {autoAlpha: 1, duration}, '+=1');
    leave('.age', 3);
    tl.addLabel('celebration')
      .set('#skip', {display: 'none'});
    enter('.six');
    tl.call(burstConfetti)
      .fromTo('.wish-hbd span', {autoAlpha: 0, y: -rise}, {
          autoAlpha: 1, y: 0, color: '#ff69b4', duration,
          stagger: reducedMotion ? 0 : 0.06, immediateRender: false
      });
    if (!reducedMotion) {
        tl.fromTo('.baloons img', {autoAlpha: 0.7, y: window.innerHeight + 150}, {
            autoAlpha: 0, y: -300, duration: 5, stagger: 0.08, immediateRender: false
        }, '<')
        .fromTo('.eight svg', {autoAlpha: 0.2, scale: 1}, {
            autoAlpha: 0, scale: 6, duration: 2, stagger: 0.15, immediateRender: false
        }, '<');
    }
    tl.to({}, {duration: 18});
    // The gallery stays in document flow through the surprise and ending.
    enter('.final-surprise');
    tl.call(() => $('.final-surprise').scrollIntoView({behavior: reducedMotion ? 'auto' : 'smooth', block: 'center'}))
      .to('.one-more', {autoAlpha: 1, duration})
      .to('.final-note', {autoAlpha: 1, duration}, '+=2.5')
      .to({}, {duration: 4});
    enter('.nine');
    tl.play(0);
}
