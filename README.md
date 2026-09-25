# Happy Birthday, Luv ❤️

A personal birthday website for Khawar Ali, celebrating his 21st birthday on 26 September 2026. Built with plain HTML, CSS, and JavaScript, with GSAP animations and a SweetAlert2 music prompt.

## Open the website

Open `index.html` in a modern browser, or serve this folder with a local static server such as VS Code Live Server. No build step or package installation is required. The folder can also be published on a static web host.

Internet access loads GSAP, SweetAlert2, and Google Fonts. If the animation library is unavailable, the page falls back to readable content; the music prompt has a native fallback.

## Experience and controls

- The countdown unlocks at `2026-09-26T00:00:00+05:00` (midnight Pakistan time), then asks whether to play music.
- Most sections advance automatically. **Next →** advances one section.
- **20 → 21 waits for interaction:** tap the number, swipe upward on it, or press **Turn the page →**. Keyboard users can activate either button with Enter or Space. Next also triggers the transformation while waiting; afterward, autoplay resumes.
- The long message and poem each have **Pause to read**. This reveals the complete text and pauses the presentation until **Continue →** or Next is pressed.
- The poem reveals one line every 1.1 seconds, then briefly holds the complete poem.
- The full-screen carousel includes six photos, shown for four seconds each. Photos fit without cropping; swipe left or right to change them. Use its arrows, left/right keyboard keys while focused inside the carousel, or swipe to browse. Tap a photo to open the full-screen lightbox, which also supports swipes and arrows; close with the close button or Escape.
- The floating music button toggles playback. Replay restarts the presentation and restarts music if it is playing.
- Tap **luv ❤️** three times in the intro for a small Easter egg.
- Reduced-motion preferences are respected. The full birthday message is also available to reread at the ending.

## Edit the content

| File | Purpose |
| --- | --- |
| `index.html` | Greeting, personal message, poem, photo references, and ending |
| `style/main.css` | Colours, typography, responsive layouts, and visual effects |
| `script/main.js` | Countdown, section timings, navigation, music, and carousel |
| `img/photo-1.jpeg` … `img/photo-6.jpeg` | Photos in carousel order |
| `music/hbd.mpeg` | Looping background music |

To replace a photo, replace its JPEG or update its `src` in `index.html`. To add another, add a `.photo-button` inside `.photo-gallery`; autoplay and the counter use the number of photo buttons automatically. Captions are intentionally omitted.

Adjust section timing in `goToSection()` in `script/main.js`. The age section uses an explicit GSAP pause; it has no automatic interaction timeout. Update `birthdayTime` to change the countdown date, keeping an explicit timezone offset.

The countdown uses the visitor's device clock and is a presentation gate, not a security system. Publishing this folder also publishes its included photos and message.
