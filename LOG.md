# LOG (append-only)

2026-11-18 12:45 · intake · brief received with 5 style screenshots; reference video URL blocked by the session network policy (youtube.com), so the style was analysed from the screenshots only · assets/refs/style · done
2026-11-18 12:50 · setup · project scaffold, render starter copied to src/, OFL fonts (Almarai, Tajawal, Alexandria) vendored from Fontsource · assets/fonts, src/ · done
2026-11-18 12:55 · owner feedback · never IBM Plex, use modern fonts like Almarai; use Higgsfield (600 credits) for production, code fallback for Arabic · TASTE.md §9 · recorded
2026-11-18 12:57 · owner sent 5 product photos in chat (visible to the agent, not saved to disk) -> product described from them; logo file still not received · - · product facts recorded in TASTE.md §1
2026-11-18 13:00 · design · panther sheet on 3 models (Seedream 5.5 / Nano Banana Pro / GPT Image 2.6); chose the Nano Banana sheet (bold outline, flat fills, big eyes) · assets/ai/design · locked
2026-11-18 13:02 · design · product sheet redrawn from the photos; v1 pole too short -> v2 with 70 cm pole, taller rail, correct keypad grid, no logo · assets/ai/design/scale-sheet-v2.png · locked
2026-11-18 13:02 · design · shopkeeper sheet · assets/ai/design/merchant-sheet.png · locked
2026-11-18 13:05 · key frames · 10 vertical frames (GPT Image 2.6 high 2K), each anchored to the sheets / parent frame · assets/ai/keys · all usable first try (one rate-limit retry)
2026-11-18 13:12 · animation · 7 clips: Kling 3.0 Pro x6 (start or start+end frame, silent), Kling 4.0 x1 for the eye-open comparison (cleaner, used) · assets/ai/video, assets/ai/clips · all usable; no morphing found on contact sheets
2026-11-18 13:15 · code · ink/post/text/fx/seg7/shot libs + 9 scenes; clips time-remapped to cues (swipe anchors measured from motion energy) · src/ · contact sheets reviewed
2026-11-18 13:20 · review fixes · headlines clipped at frame edge -> auto-fit to 940 px; dust drawn as outlined balls -> soft; flashes reduced; load shot re-framed as a 3-step pull-back; LED decimal points enlarged; end-card pack shot feathered; black edge on shakes -> plate underlay · src/ · re-sheeted
2026-11-18 13:23 · sound · tools/make_audio.py; first mix measured ~20 dB bass-heavy vs 0.5-6 kHz -> two balance passes; all 35 sounding cues verified to have energy within 30 ms · assets/audio/mix-v1.wav · -14.0 LUFS, -1.8 dBTP (metrics only, not auditioned)
2026-11-18 13:25 · render · full 1080x1920 30 fps preview with audio · renders/previews/Black Panther Scale Ad - Preview v1.mp4 · see renders/logs/preview-v1.log
2026-11-18 13:29 · copy fix · "بيشيل" -> "بشيل" (Jordanian form); first full render stopped on purpose and restarted so the preview carries the fix · plan/copy.json · re-rendering
2026-11-18 13:33 · render · Preview v1 complete: 720 frames, 1080x1920, 30 fps, 24.000 s, H.264 yuv420p + AAC 48 kHz, faststart, 32.9 MB; measured -14.1 LUFS / -1.6 dBTP; frames pulled back from the encoded file and checked at 14 timestamps · renders/previews/Black Panther Scale Ad - Preview v1.mp4, renders/logs/preview-v1.log · ready for owner review (not auditioned by ear)
2026-11-18 13:40 · owner reaction · Preview v1 received very positively ("اشي بجنن"); no change requests given; this is a reaction, not a sign-off on the open items · PROGRESS.md · waiting for logo file, price/contact, product facts and an audio listen
