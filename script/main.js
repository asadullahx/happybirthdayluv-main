const birthdayTime = Date.parse('2026-09-26T00:00:00+05:00');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let birthdayTimeline;
let song;
let confettiTimer;
let eggTimer;
let unlocked = false;
let currentSection = -1;
let navigationLockedUntil = 0;
let photoIndex = 0;
let photoTimeline;
let carouselManual = false;
let presentationStarted = false;
let ageTurned = false;
const sections = [
    {name: 'Intro', selector: '.container > .one'},
    {name: 'Birthday greeting', selector: '.three'},
    {name: 'Your birthday message', selector: '.four'},
    {name: 'Twenty to twenty-one', selector: '.age'},
    {name: 'Poem', selector: '.poem'},
    {name: 'Eight years', selector: '.memory'},
    {name: 'Happy Birthday', selector: '.celebration'},
    {name: 'Photos', selector: '.six'},
    {name: 'One more thing', selector: '.final-surprise'},
    {name: 'Ending', selector: '.nine'}
];
const $ = selector => document.querySelector(selector);

// The midnight gate is presentation only; the device clock supplies the time.
document.addEventListener('DOMContentLoaded', () => {
    song = $('.song');
    $('#music-control').addEventListener('click', () => {
        if (song.paused) playMusic(); else song.pause();
    });
    song.addEventListener('play', updateMusicControl);
    song.addEventListener('pause', updateMusicControl);
    $('#next').addEventListener('click', nextSection);
    $('#turn-age').addEventListener('click', turnAge);
    $('#age-trigger').addEventListener('click', turnAge);
    let ageTouchY;
    $('#age-trigger').addEventListener('pointerdown', event => { ageTouchY = event.clientY; });
    $('#age-trigger').addEventListener('pointerup', event => {
        if (ageTouchY !== undefined && ageTouchY - event.clientY > 25) turnAge();
        ageTouchY = undefined;
    });
    $('#age-trigger').addEventListener('pointercancel', () => { ageTouchY = undefined; });
    $('#read-message').addEventListener('click', () => {
        if (currentSection !== 2 || !birthdayTimeline) return;
        if (birthdayTimeline.paused()) {
            birthdayTimeline.play();
            $('#read-message').textContent = 'Pause to read';
            $('#read-message').setAttribute('aria-pressed', 'false');
        } else {
            birthdayTimeline.seek('letter-read').pause();
            $('#read-message').textContent = 'Continue →';
            $('#read-message').setAttribute('aria-pressed', 'true');
        }
    });
    $('#read-poem').addEventListener('click', () => {
        if (currentSection !== 4 || !birthdayTimeline) return;
        if (birthdayTimeline.paused()) {
            birthdayTimeline.play();
            $('#read-poem').textContent = 'Pause to read';
            $('#read-poem').setAttribute('aria-pressed', 'false');
        } else {
            birthdayTimeline.seek('poem-read').pause();
            $('#read-poem').textContent = 'Continue →';
            $('#read-poem').setAttribute('aria-pressed', 'true');
        }
    });
    setupCarousel();
    $('.letter-again p').textContent = $('.hbd-chatbox').textContent;
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
    $('#next').hidden = true;
    $('#progress').hidden = true;
    $('#read-message').hidden = true;
    $('#read-poem').hidden = true;
    $('#turn-age').hidden = true;
    showPhoto(photoIndex, false);
}

function replay() {
    // Closing must not resume the previous playback state during reset.
    if ($('#lightbox').open) $('#lightbox').close();
    clearConfetti();
    setParticles(false);
    $('#egg-message').hidden = true;
    if (!song.paused) song.currentTime = 0;
    window.scrollTo(0, 0);
    $('.letter-again').open = false;
    showPhoto(0, false);
    if (birthdayTimeline) goToSection(0);
}

function setupLightbox() {
    const dialog = $('#lightbox');
    let wasPlaying = false;
    let opener;
    const cards = [...document.querySelectorAll('.photo-button')];
    let enlargedIndex = 0;
    const displayPhoto = index => {
        enlargedIndex = (index + cards.length) % cards.length;
        const source = cards[enlargedIndex].querySelector('img');
        dialog.querySelector('img').src = source.src;
        dialog.querySelector('img').alt = source.alt;
        $('#lightbox-counter').textContent = `${enlargedIndex + 1} / ${cards.length}`;
        showPhoto(enlargedIndex, false);
        opener = cards[enlargedIndex];
    };
    document.querySelectorAll('.photo-button').forEach(button => {
        button.addEventListener('click', () => {
            displayPhoto(cards.indexOf(button));
            wasPlaying = Boolean(birthdayTimeline && !birthdayTimeline.paused() && birthdayTimeline.progress() < 1);
            if (wasPlaying) birthdayTimeline.pause();
            dialog.showModal();
        });
    });
    $('#close-lightbox').addEventListener('click', () => dialog.close());
    $('#lightbox-prev').addEventListener('click', () => displayPhoto(enlargedIndex - 1));
    $('#lightbox-next').addEventListener('click', () => displayPhoto(enlargedIndex + 1));
    dialog.addEventListener('keydown', event => {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault();
            displayPhoto(enlargedIndex + (event.key === 'ArrowLeft' ? -1 : 1));
        }
    });
    let startTouch;
    dialog.addEventListener('touchstart', event => {
        startTouch = event.touches.length === 1 ? [event.touches[0].clientX, event.touches[0].clientY] : null;
    }, {passive: true});
    dialog.addEventListener('touchend', event => {
        if (!startTouch) return;
        const dx = event.changedTouches[0].clientX - startTouch[0];
        const dy = event.changedTouches[0].clientY - startTouch[1];
        if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) displayPhoto(enlargedIndex + (dx < 0 ? 1 : -1));
        startTouch = null;
    }, {passive: true});
    dialog.addEventListener('touchcancel', () => { startTouch = null; });
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

// One active section timeline owns autoplay. Next kills it before advancing a
// single index, so callbacks from a skipped section cannot advance us again.
function animationTimeline() {
    if (!presentationStarted) {
        splitGraphemes($('#name'));
        splitGraphemes($('.wish-hbd'));
        const letter = $('.hbd-chatbox');
        const text = letter.textContent;
        letter.setAttribute('aria-label', text);
        letter.replaceChildren();
        for (const token of text.split(/(\s+)/u)) {
            if (!token) continue;
            if (/^\s+$/u.test(token)) letter.appendChild(document.createTextNode(token));
            else {
                const word = document.createElement('span');
                word.textContent = token;
                word.setAttribute('aria-hidden', 'true');
                letter.appendChild(word);
            }
        }
        presentationStarted = true;
    }
    $('.container').style.visibility = 'visible';
    $('#progress').hidden = false;
    goToSection(0);
}

function turnAge() {
    if (currentSection !== 3 || !birthdayTimeline || ageTurned) return;
    ageTurned = true;
    birthdayTimeline.seek('turn', true).play();
}

function nextSection() {
    if (!birthdayTimeline || performance.now() < navigationLockedUntil || currentSection >= sections.length - 1) return;
    if (currentSection === 3 && !ageTurned) {
        turnAge();
        navigationLockedUntil = performance.now() + 400;
        return;
    }
    goToSection(currentSection + 1);
}

function goToSection(index) {
    if (index < 0 || index >= sections.length) return;
    birthdayTimeline?.kill();
    photoTimeline?.kill();
    clearConfetti();
    currentSection = index;
    navigationLockedUntil = performance.now() + 400;
    // Keep the memory card available alongside the final note and replay.
    for (let i = 0; i < sections.length; i++) {
        const scene = $(sections[i].selector);
        const keep = i === index || (index >= 8 && i === 7) || (index === 9 && i === 8);
        gsap.set(scene, {display: keep ? (i === 4 || i === 7 ? 'flex' : 'block') : 'none', autoAlpha: keep ? 1 : 0, y: 0});
    }
    gsap.set('.baloons img, .eight svg', {autoAlpha: 0});
    if (index >= 8) showPhoto(photoIndex, false);
    $('#next').hidden = index === sections.length - 1;
    $('#progress').value = index + 1;
    $('#progress').setAttribute('aria-valuetext', `${index + 1} of ${sections.length}: ${sections[index].name}`);
    setParticles(index >= 2 && index <= 5);
    const scene = $(sections[index].selector);
    if (index < 8) window.scrollTo(0, 0);
    else scene.scrollIntoView({behavior: reducedMotion ? 'auto' : 'smooth', block: 'center'});
    const tl = gsap.timeline({paused: true, onComplete: () => {
        if (currentSection === index && index < sections.length - 1) goToSection(index + 1);
    }});
    birthdayTimeline = tl;
    const duration = reducedMotion ? 0.12 : 0.5;
    const rise = reducedMotion ? 0 : 12;
    const hold = seconds => tl.to({}, {duration: seconds});
    tl.fromTo(scene, {autoAlpha: 0, y: rise}, {autoAlpha: 1, y: 0, duration});
    switch (index) {
        case 0:
            gsap.set('#name', {autoAlpha: 1});
            gsap.set('#affection', {autoAlpha: 0});
            tl.fromTo('#name span', {autoAlpha: 0}, {autoAlpha: 1, duration: 0.08, stagger: reducedMotion ? 0 : 0.07})
              .to('#name', {autoAlpha: 0, duration}, '+=1.2')
              .to('#affection', {autoAlpha: 1, duration});
            hold(2.5);
            break;
        case 1:
            hold(2.4);
            break;
        case 2:
            $('#read-message').textContent = 'Pause to read';
            $('#read-message').setAttribute('aria-pressed', 'false');
            tl.fromTo('.hbd-chatbox span', {autoAlpha: 0}, {
                autoAlpha: 1, duration: reducedMotion ? 0 : 0.18, stagger: reducedMotion ? 0 : 0.055
            }).addLabel('letter-read');
            // Give the letter breathing room; Pause to read offers unlimited time.
            hold(reducedMotion ? 25 : 8);
            break;
        case 3:
            ageTurned = false;
            gsap.set('.age-zero', {autoAlpha: 1, yPercent: 0, rotationX: 0});
            gsap.set('.age-one', {autoAlpha: 0, yPercent: reducedMotion ? 0 : 100, rotationX: reducedMotion ? 0 : -60});
            gsap.set('.age-note', {autoAlpha: 0});
            gsap.set('.age-intro, .age-hint, #turn-age', {autoAlpha: 1});
            gsap.set('.age-sparkles i', {autoAlpha: 0, x: 0, y: 0, scale: 0.4});
            gsap.set('.age-number', {scale: 1, textShadow: '0 0 0px transparent'});
            // Wait indefinitely after revealing 20. Only a user action resumes.
            tl.addPause()
              .addLabel('turn', '+=0.001')
              .to('#turn-age, .age-intro, .age-hint', {autoAlpha: 0, duration: 0.15})
              .to('.age-zero', {autoAlpha: 0, yPercent: reducedMotion ? 0 : -110, rotationX: reducedMotion ? 0 : 60, duration: 0.45}, 'turn')
              .to('.age-one', {autoAlpha: 1, yPercent: 0, rotationX: 0, duration: 0.45, ease: 'power2.out'}, 'turn+=0.12')
              .to('.age-number', {scale: reducedMotion ? 1 : 1.06, textShadow: '0 0 28px #e6579266', duration: 0.25, repeat: 1, yoyo: true})
              .to('.age-note', {autoAlpha: 1, duration: 0.25});
            if (!reducedMotion) {
                tl.to('.age-sparkles i', {autoAlpha: 0.8, duration: 0.12}, 'turn+=0.4')
                  .to('.age-sparkles i', {
                      x: i => Math.cos(i * Math.PI / 4) * 125,
                      y: i => Math.sin(i * Math.PI / 4) * 105,
                      scale: 1.2, autoAlpha: 0, duration: 0.8, ease: 'power2.out'
                  }, 'turn+=0.52');
            }
            hold(1.5);
            break;
        case 4:
            $('#read-poem').textContent = 'Pause to read';
            $('#read-poem').setAttribute('aria-pressed', 'false');
            tl.fromTo('.poem p', {autoAlpha: 0, y: rise}, {
                autoAlpha: 1, y: 0, duration: reducedMotion ? 0.12 : 0.7, stagger: 1.1
            }).addLabel('poem-read');
            hold(3.5);
            break;
        case 5:
            tl.fromTo('.memory .years', {autoAlpha: 0}, {autoAlpha: 1, duration})
              .fromTo('.memory p:last-child', {autoAlpha: 0}, {autoAlpha: 1, duration}, '+=0.5');
            hold(2.5);
            break;
        case 6:
            tl.call(burstConfetti)
              .fromTo('.wish-hbd span', {autoAlpha: 0, y: -rise}, {
                  autoAlpha: 1, y: 0, color: '#ff69b4', duration, stagger: reducedMotion ? 0 : 0.025
              });
            if (!reducedMotion) {
                gsap.set('.baloons img', {
                    left: i => `${5 + (i * 29) % 90}%`, right: 'auto', top: 0,
                    xPercent: -38, x: 0, rotation: i => (i % 5 - 2) * 7
                });
                tl.fromTo('.baloons img', {autoAlpha: 0.75, y: i => window.innerHeight + (i % 5) * 65}, {
                    autoAlpha: 0, y: -650, x: i => (i % 2 ? 1 : -1) * (25 + i % 4 * 15),
                    rotation: i => (i % 3 - 1) * 12, duration: 2.8, stagger: 0.025
                }, 0.35)
                .fromTo('.eight svg', {autoAlpha: 0.18, scale: 1}, {
                    autoAlpha: 0, scale: 5, duration: 1.5, stagger: 0.06
                }, 0.35);
            }
            hold(1.8);
            break;
        case 7:
            carouselManual = false;
            showPhoto(0, false);
            // Include every photo in autoplay as well as manual browsing.
            for (let i = 1; i < document.querySelectorAll('.photo-button').length; i++) {
                hold(4);
                tl.call(() => { if (!carouselManual) showPhoto(i); });
            }
            hold(4);
            break;
        case 8:
            gsap.set('.one-more, .final-note', {autoAlpha: 0});
            tl.to('.one-more', {autoAlpha: 1, duration})
              .to('.final-note', {autoAlpha: 1, duration}, '+=1.2');
            hold(2.5);
            break;
        case 9:
            // This screen stays available, along with photos and the full letter.
            break;
    }
    if (index < 7) tl.to(scene, {autoAlpha: 0, duration: reducedMotion ? 0.1 : 0.3});
    tl.play(0);
}

function setupCarousel() {
    showPhoto(0, false);
    const move = delta => {
        carouselManual = true;
        showPhoto(photoIndex + delta);
        // Give manual browsing a fresh viewing window without delaying other stages.
        if (currentSection === 7 && birthdayTimeline && !$('#lightbox').open) {
            birthdayTimeline.seek(Math.max(0, birthdayTimeline.duration() - 4), true).play();
        }
    };
    $('#photo-prev').addEventListener('click', () => move(-1));
    $('#photo-next').addEventListener('click', () => move(1));
    $('.six').addEventListener('keydown', event => {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault();
            move(event.key === 'ArrowLeft' ? -1 : 1);
        }
    });
    let touchStart;
    let swiped = false;
    const gallery = $('.photo-gallery');
    gallery.addEventListener('touchstart', event => {
        touchStart = [event.touches[0].clientX, event.touches[0].clientY];
        swiped = false;
    }, {passive: true});
    gallery.addEventListener('touchend', event => {
        if (!touchStart) return;
        const dx = event.changedTouches[0].clientX - touchStart[0];
        const dy = event.changedTouches[0].clientY - touchStart[1];
        if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) {
            swiped = true;
            move(dx < 0 ? 1 : -1);
        }
        touchStart = null;
    }, {passive: true});
    gallery.addEventListener('click', event => {
        if (swiped) { event.preventDefault(); event.stopPropagation(); swiped = false; }
    }, true);
}

function showPhoto(index, animate = true) {
    const cards = [...document.querySelectorAll('.photo-button')];
    const next = (index + cards.length) % cards.length;
    const previous = photoIndex;
    photoTimeline?.kill();
    photoIndex = next;
    const displayCard = () => {
        cards.forEach((card, i) => {
            card.hidden = i !== next;
            card.style.opacity = '1';
            card.style.transform = '';
        });
        $('#photo-counter').textContent = `${next + 1} / ${cards.length}`;
    };
    if (!animate || reducedMotion || !window.gsap || previous === next) { displayCard(); return; }
    const direction = index > previous ? 1 : -1;
    // Finish any interrupted card transition before starting another.
    cards.forEach((card, i) => { card.hidden = i !== previous; });
    photoTimeline = gsap.timeline()
        .to(cards[previous], {opacity: 0, x: -direction * 12, duration: 0.12})
        .call(displayCard)
        .fromTo(cards[next], {opacity: 0, x: direction * 12}, {opacity: 1, x: 0, duration: 0.22, immediateRender: false});
}
