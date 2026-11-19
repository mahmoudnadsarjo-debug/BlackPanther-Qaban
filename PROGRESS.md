# PROGRESS - Black Panther back-rail scale ad   (updated 2026-11-18)
Phase: preview (v1 rendered and checked, waiting for the owner's review)
Current version: v1 -> renders/previews/Black Panther Scale Ad - Preview v1.mp4

Done:
- Style analysed from the owner's screenshots; panther, product and shopkeeper designs locked (assets/ai/design).
- 10 key frames + 7 animated clips generated on Higgsfield (94.25 of 600 credits used, 505.75 left).
- 9 scenes composited in code with Arabic type (Almarai), LED digits, measure lines, effects, grade.
- Original synthesized soundtrack + SFX, mastered to -14 LUFS.

Next step: owner reviews Preview v1 -> apply notes -> render "Final v1" into renders/final.

Open issues / inputs still needed from the owner:
- REAL LOGO FILE not received. A stand-in emblem (panther head from the character sheet) is on the indicator and the end card.
- Product photos arrived only as chat images (not on disk). The drawing was made from them; exact-match check is by eye.
- Unknown facts, deliberately NOT claimed in the ad: capacity (kg), accuracy, battery/charging, warranty, price, delivery area, phone/WhatsApp.
  CTA is "راسلنا عالخاص" until a number is supplied.
- Sound has been measured, not listened to. The owner should audition it on a phone.
- The price example on the indicator (12.500 kg x 0.850 = 10.625) is illustrative.
- Confirm Higgsfield plan terms cover commercial / paid-ad use of the generated art.
- Preview v1 has the "ارتفاع 70 سم" label running to x~1039 at y~1040, where TikTok/Reels buttons sit. Fixed in src/scenes/s4_reveal.js (label now ends at x~936); the fix appears in the next render, Preview v1 itself is unchanged.
- Reference video itself could not be opened (youtube.com is outside this session's network allowlist).

Approvals: none formal yet. 2026-11-18 the owner reacted very positively to Preview v1 with no change requests; the open items above still need answers before a Final.

Key files: plan/beats.json (timing) · plan/copy.json (all Arabic text) · src/scenes/*.js · tools/make_audio.py · TASTE.md · manifest.json
