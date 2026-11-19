# Case study: Black Panther back-rail scale (24 s, Arabic, 9:16)

A complete run of this workflow, including what went wrong. The plan files are in `assets/example-black-panther/`, the scene code in `starter/src/patterns/`.

## Brief

- **Product:** an electronic price-computing platform scale with a back rail, sold in Jordan under the owner's brand "Black Panther". Factory mark on the device ("J.B.C") must not show.
- **Given:** five style screenshots of an indie hand-drawn animatic, five product photos (sent mid-task as chat images), base 50 x 40 cm, 70 cm from platform to display head, a 600-credit generator budget, "modern Arabic fonts like Almarai, never IBM Plex".
- **Not given:** logo file, price, phone number, capacity, battery, warranty. A linked reference video and a folder on the owner's PC were unreachable.
- **Audience:** shop owners; copy in Jordanian dialect.

## Story

| # | Time | Beat | On screen |
|---|---|---|---|
| 1 | 0-2.5 | Hook: panther's eyes snap open in a dark shop | "There's a thief / in your shop..." |
| 2 | 2.5-6 | Problem: angry shopkeeper, old dial scale, needle swinging, winged coins fly off | "Your old scale!" → "Every wrong gram = money flying away" |
| 3 | 6-9.5 | Gag: the panther taps the old scale twice and shoves it off the counter | "Goodbye" |
| 4 | 9.5-12 | Reveal: new scale slams in, panther lands on it | product name / brand name |
| 5 | 12-14 | Dimensions draw on (same shot) | height 70 cm · base 50×40 cm · back rail |
| 6 | 14-16 | Display close-up: weight × unit price = total | "Works out the price for you" |
| 7 | 16-18 | Load: three sacks, panther lounging on top, three widening hits | "Diamond-plate steel platform / for heavy work" |
| 8 | 18-20 | Payoff: shopkeeper and panther fist-to-paw bump, coins rain | "Right weight = right profit" |
| 9 | 20-24 | End card | brand, "Limited quantity", "Order now", "Message us" |

Why it works: the hook's threat is a misdirect (the mascot looks like the thief; the cut names the old scale), the gag is something every cat owner recognises, the brand name lands on the frame where the mascot touches the product, and every feature line is a fact the owner gave or the photos show.

## What was generated

| Asset | Model | Credits |
|---|---|---|
| Mascot sheet x3 (comparison) | Seedream 5.5, Nano Banana Pro, GPT Image 2.6 | 8.25 |
| Product sheet x2 (comparison) + corrected v2 | Nano Banana Pro, GPT Image 2.6 | 7.5 |
| Shopkeeper sheet | GPT Image 2.6 | 2.75 |
| 10 key frames (incl. two end frames and a display plate) | GPT Image 2.6 high 2K | 27.5 |
| 6 clips, 3-5 s | Kling 3.0 Pro, silent | 38.5 |
| 1 clip, 3 s (comparison, used) | Kling 4.0 1080p | 9.75 |
| **Total** | | **94.25** |

Every key frame was usable on the first try once the sheets existed. All seven clips were usable; none showed morphing on their contact sheets.

## What went wrong, and what it taught

| Problem | What happened | Lesson now in the skill |
|---|---|---|
| Files assumed present | Owner said "I sent the photos"; only the style screenshots were on disk. Later photos arrived as chat images, visible but not saved. | Check where files really are; say what did not arrive; draw from sight and flag it |
| Product proportions | First product sheet drew the pole at about half height despite "70 cm". | Give ratios ("1.4x the platform width"); correct with a numbered pass |
| Reference bleeding | One model ghosted the mascot sheet into the product sheet when told to use it for style only. | Use the model that handles multi-reference cleanly for that job |
| Rate limit | One of five parallel image requests returned 429. | Resubmit only that index |
| Clipped headlines | Two headlines ran off both edges at their set size. | `line()` auto-fits to 940 px; still read the sheet |
| Dust looked like bubbles | Outlined circles at the product's feet. | Soft, unoutlined dust |
| Too many flashes | A white flash on every cut washed frames out. | Caps and spacing in the rules; prefer a chromatic burst |
| Load shot framing | First tight step showed the mascot's face instead of the platform; later the headline covered the display head. | Compute visible range from zoom and anchor; check every step |
| Black edge on shake | A shake at zoom 1.0 exposed the canvas edge. | `plate()` underlay; resting zoom ≥ 1.02 |
| Decimal points | LED decimals were 4 px dots lost in the glow. | Decimal has its own cell; check a full-size still |
| Bass-heavy mix | First mix had ~20 dB more energy below 120 Hz than in 0.5-2 kHz. | Measured trims; `audio_report.py` every time |
| Dialect slip | One verb used a neighbouring dialect's prefix; caught on a re-read after the first full render had started, costing a re-render. | Read all copy once more *before* the long render; say when not native |
| Unverifiable sound | Nobody could listen. | Report "measured, not auditioned" and ask the owner to listen |
| Label under the platform buttons | The "height 70 cm" pill ran to x 1039 at y 1040, where TikTok/Reels buttons sit. Missed in every review; found when the skill was re-tested cold on another product. | Edge-anchored pills, `--guides`, and a grey-box block-out before generating |

## Numbers worth remembering

- 24.0 s, 9 scenes, 37 cues, 120 BPM (cuts on half-seconds).
- 720 frames at 1080 x 1920: about 4-5 minutes to render on a small cloud machine.
- Final file about 33 MB, H.264 + AAC, -14 LUFS, true peak about -1.6 dBTP.
- Open at hand-over: real logo file, price / contact, capacity and battery facts, a human listen.

## The owner's rules from this project

Recorded as they were given, because rules like these are what a resumed session must not forget:
- Never IBM Plex; use modern Arabic faces such as Almarai.
- The mascot must look tidy and anatomically logical, not like careless AI output.
- The factory logo must not be visible; the owner's panther logo replaces it.
- Use the generator with the best-suited model within 600 credits; if it cannot handle Arabic, set the Arabic in code. (That became the core split of this skill.)
