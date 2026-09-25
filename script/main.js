const birthdayTime = Date.parse('2026-09-26T00:00:00+05:00');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let birthdayTimeline;
let song;
let confettiTimer;
let unlocked = false;

document.addEventListener('DOMContentLoaded', () => {
    song = document.querySelector('.song');
    document.querySelector('#music-control').addEventListener('click', () => {
        if (song.paused) playMusic(); else song.pause();
    });
    song.addEventListener('play', updateMusicControl);
    song.addEventListener('pause', updateMusicControl);
    document.querySelector('#skip').addEventListener('click', () => {
        if (birthdayTimeline) birthdayTimeline.seek('celebration').play();
    });
    setupLightbox();
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
    const countdown = document.querySelector('#countdown');
    countdown.classList.add('leaving');
    if (immediate) countdown.hidden = true;
    setTimeout(() => {
        countdown.hidden = true;
        const container = document.querySelector('.container');
        container.hidden = false;
        container.inert = false;
        startBirthdaySurprise();
    }, immediate || reducedMotion ? 0 : 450);
}

function updateMusicControl() {
    const button = document.querySelector('#music-control');
    button.textContent = song.paused ? 'Play music ♫' : 'Pause music ♫';
    button.setAttribute('aria-pressed', String(!song.paused));
}

async function playMusic() {
    try { await song.play(); } catch (_) { song.pause(); }
    updateMusicControl();
}

async function startBirthdaySurprise() {
    let wantsMusic = false;
    if (window.Swal) {
        const result = await Swal.fire({
            title: 'Do you want to play music in the background?',
            icon: 'question', showCancelButton: true,
            confirmButtonColor: '#e65792', cancelButtonColor: '#777',
            confirmButtonText: 'Yes', cancelButtonText: 'No',
            allowOutsideClick: false
        });
        wantsMusic = result.isConfirmed;
    } else {
        wantsMusic = window.confirm('Do you want to play music in the background?');
    }
    if (wantsMusic) playMusic(); else song.pause();
    document.querySelector('.presentation-controls').hidden = false;
    if (window.TimelineMax) animationTimeline(); else showStaticBirthday();
}

function splitGraphemes(element) {
    const text = element.textContent;
    const characters = typeof Intl.Segmenter === 'function'
        ? Array.from(new Intl.Segmenter(undefined, {granularity: 'grapheme'}).segment(text), part => part.segment)
        : Array.from(text);
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
    document.querySelector('.container').classList.add('static-presentation');
    document.querySelector('#skip').hidden = true;
    document.querySelector('#replay').onclick = () => window.scrollTo({top: 0, behavior: 'smooth'});
}

function setupLightbox() {
    const dialog = document.querySelector('#lightbox');
    let wasPlaying = false;
    document.querySelectorAll('.photo-button').forEach(button => {
        button.addEventListener('click', () => {
            const source = button.querySelector('img');
            const enlarged = dialog.querySelector('img');
            enlarged.src = source.src;
            enlarged.alt = source.alt;
            wasPlaying = Boolean(birthdayTimeline && !birthdayTimeline.paused());
            if (wasPlaying) birthdayTimeline.pause();
            dialog.showModal();
        });
    });
    document.querySelector('#close-lightbox').onclick = () => dialog.close();
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener('close', () => { if (wasPlaying) birthdayTimeline.play(); });
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

// animation timeline
const animationTimeline = () => {
    splitGraphemes(document.querySelector('.hbd-chatbox'));
    splitGraphemes(document.querySelector('.wish-hbd'));

    const ideaTextTrans = {
        autoAlpha: 0,
        y: -20,
        rotationX: 5,
        skewX: "15deg"
    }

    const ideaTextTransLeave = {
        autoAlpha: 0,
        y: 20,
        rotationY: 5,
        skewX: "-15deg"
    }

    // timeline
    const tl = new TimelineMax({onComplete: () => { document.querySelector('#skip').hidden = true; }});
    birthdayTimeline = tl;
    if (reducedMotion) tl.timeScale(3);
    tl.set('.six', {zIndex: 10});
    tl.set('#affection', {autoAlpha: 0});
    tl.set('#name', {autoAlpha: 1});

    tl.to(".container", 0.6, {
        visibility: "visible"
    })
    .from(".one", 0.7, {
        autoAlpha: 0,
        y: 10
    })
    .to('#name', 0.35, {autoAlpha: 0}, '+=0.8')
    .to('#affection', 0.5, {autoAlpha: 1})
    .from(".two", 0.4, {
        autoAlpha: 0,
        y: 10
    })
    .to(".one",
        0.7,
        {
            autoAlpha: 0,
            y: 10
        },
    "+=3.5")
    .to(".two",
        0.7,
        {
            autoAlpha: 0,
            y: 10
        },
    "-=1")
    .from(".three", 0.7, {
        autoAlpha: 0,
        y: 10
    })
    .to(".three",
        0.7,
        {
            autoAlpha: 0,
            y: 10
        },
    "+=3")
    .from(".four", 0.7, {
        scale: 0.2,
        autoAlpha: 0,
    })
    .staggerTo(
        ".hbd-chatbox span",
        1.5, {
            visibility: "visible",
        },
        reducedMotion ? 0 : 0.025
    )
    .to(
        ".four",
        0.5, {
            scale: 0.2,
            autoAlpha: 0,
            y: -150
        },
    reducedMotion ? "+=90" : "+=12")
    .from(".idea-1", 0.7, ideaTextTrans)
    .to(".idea-1", 0.7, ideaTextTransLeave, "+=2.5")
    .from(".idea-2", 0.7, ideaTextTrans)
    .to(".idea-2", 0.7, ideaTextTransLeave, "+=2.5")
    .from(".idea-3", 0.7, ideaTextTrans)
    .to(".idea-3", 0.7, ideaTextTransLeave, "+=2.5")
    .from(".idea-4", 0.7, ideaTextTrans)
    .to(".idea-4 strong", 0.5, {
        scale: 1.2,
        x: 10,
        backgroundColor: "rgb(21, 161, 237)",
        color: "#fff",
    })
    .to(".idea-4", 0.7, ideaTextTransLeave, "+=2.5")
    .from(".idea-7", 0.7, ideaTextTrans)
    .to(".idea-7", 0.7, ideaTextTransLeave, "+=2.5")
    .from(
        ".idea-5",
        0.7, {
            rotationX: 15,
            rotationZ: -10,
            skewY: "-5deg",
            y: 50,
            z: 10,
            autoAlpha: 0,
        },
        "+=1.5"
    )
    .to(
        ".idea-5 span",
        0.7, {
            rotation: 90,
            x: 8,
        },
        "+=1.4"
    )
    .to(
        ".idea-5",
        0.7, {
            scale: 0.2,
            autoAlpha: 0,
        },
        "+=2"
    )
    .staggerFrom(
        ".idea-6 span",
        0.8, {
            scale: 3,
            autoAlpha: 0,
            rotation: 15,
            ease: Expo.easeOut,
        },
        0.2
    )
    .staggerTo(
        ".idea-6 span",
        0.8, {
            scale: 3,
            autoAlpha: 0,
            rotation: -15,
            ease: Expo.easeOut,
        },
        0.2,
        "+=1.5"
    )
    .fromTo('.memory', 0.6, {autoAlpha: 0, y: 20}, {autoAlpha: 1, y: 0})
    .to('.memory', 0.5, {autoAlpha: 0}, '+=3')
    .fromTo('.age', 0.6, {autoAlpha: 0, scale: 0.8}, {autoAlpha: 1, scale: 1})
    .to('.age', 0.5, {autoAlpha: 0}, '+=2')
    .addLabel('celebration')
    .set('#skip', {display: 'none'})
    .staggerFromTo(
        ".baloons img",
        2.5, {
            autoAlpha: 0.9,
            y: 1400,
        }, {
            autoAlpha: 1,
            y: -1000,
        },
        0.2
    )
    .addLabel('party')
    .call(burstConfetti)
    .staggerFrom(
        ".wish-hbd span",
        0.7, {
            autoAlpha: 0,
            y: -50,
            // scale: 0.3,
            rotation: 150,
            skewX: "30deg",
            ease: Elastic.easeOut.config(1, 0.5),
        },
        0.1
    )
    .staggerFromTo(
        ".wish-hbd span",
        0.7, {
            scale: 1.4,
            rotationY: 150,
        }, {
            scale: 1,
            rotationY: 0,
            color: "#ff69b4",
            ease: Expo.easeOut,
        },
        0.1,
        "party"
    )
    .from(
        ".wish h5",
        0.5, {
            autoAlpha: 0,
            y: 10,
            skewX: "-15deg",
        },
        "party"
    )
    .to(".six", 0.5, {
        autoAlpha: 1,
        y: 0,
        pointerEvents: "auto",
    }, "party")
    .staggerTo(
        ".eight svg",
        1.5, {
            visibility: "visible",
            autoAlpha: 0,
            scale: 80,
            repeat: 3,
            repeatDelay: 1.4,
        },
        0.3
    )
    .to({}, reducedMotion ? 45 : 20, {})
    .to(".six", 0.5, {
        autoAlpha: 0,
        y: 30,
        zIndex: "-1",
    })
    .fromTo('.final-surprise', 0.5, {autoAlpha: 0}, {autoAlpha: 1})
    .from('.one-more', 0.5, {autoAlpha: 0, y: 10})
    .from('.final-note', 0.7, {autoAlpha: 0, y: 10}, '+=1.3')
    .to('.final-surprise', 0.5, {autoAlpha: 0}, '+=3')
    .staggerFrom('.nine p, .nine button', 1, ideaTextTrans, 1.2)
    .to(
        ".last-smile",
        0.5, {
            rotation: 90,
        },
        "+=1"
    );

    // Restart Animation on click
    const replyBtn = document.getElementById("replay");
    replyBtn.addEventListener("click", () => {
        document.querySelector('#skip').hidden = false;
        clearConfetti();
        document.querySelectorAll('.container > div').forEach(scene => { scene.scrollTop = 0; });
        if (!song.paused) { song.currentTime = 0; }
        tl.restart();
    });
}
