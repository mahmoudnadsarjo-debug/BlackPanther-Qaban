# Style analysis and prompts

## Contents
- From references to a style block
- Prompt anatomy
- Mascot sheet
- Product sheet from photos
- Supporting character sheet
- Key frames
- End frames (edits of a start frame)
- Plates for code overlays
- Animation prompts
- Reviewing what comes back

The prompt texts below are the ones that produced usable results first or second try in the worked example. Keep their structure; change the nouns.

## From references to a style block

Look at the references and write down technique only, as if briefing an illustrator who will never see them:

- **Line**: weight, colour, evenness, whether backgrounds use a thinner or lighter line than characters.
- **Shading**: flat? how many tones per colour? hard or soft shadow edges? any gradients?
- **Palette**: the three or four families (e.g. dusty lavender-greys, slate blue, deep indigo, warm cream), and the single accent.
- **Light**: where it comes from, its colour, rim light on silhouettes, glow from windows or signs.
- **Shapes and faces**: simple or detailed, eye design, proportions.
- **Finish**: chromatic fringe, bloom, grain, softness. The finish is added in code (`src/lib/post.js`) so every shot gets the same one - ask the generator for *clean* frames.

Example style block (reuse the shape, rewrite the content for your references):

```text
2D hand-drawn digital animation frame, indie animatic look. Bold confident dark aubergine-black ink outlines of slightly
uneven hand-drawn weight on characters and key props, thinner grey-purple line art on backgrounds. Flat cel shading:
each colour has one flat base tone and one hard-edged shadow shape, no gradients on characters, no airbrush, no 3D,
no photorealism. Night-time colour script: desaturated dusty lavender-greys and slate blues, deep indigo shadows, soft
pinkish-white glow from windows and lamps, thin warm cream rim light on silhouettes facing the light.
```

Boundaries, and why:
- Do not upload a third-party artist's frames as a generation reference and do not put their name in a prompt. Learning a technique is fine; feeding someone's artwork into a model to clone it is not yours to authorise, and it puts the owner's ad at risk.
- Your own generated sheets *are* references - attach them freely.

## Prompt anatomy

Every image prompt has the same five parts. Models follow structure better than adjectives.

1. **What it is** - "a single 2D hand-drawn animation frame in the exact drawing style of the reference sheet".
2. **Scene** - who, where, doing what, expression, in plain sentences. Say which reference is which ("the panther from the second reference").
3. **Composition** - where the subject sits and which areas stay calm for text ("the top fifth is calm dark shelving; a headline will be added there later").
4. **Colour / light** - only what differs from the style block.
5. **Exclusions** - always end with: `Clean flat colours, no film grain, no chromatic aberration, no blur. No text, no letters, no logos, no watermark, no signature.` If digits on an object are unavoidable, allow exactly those ("the only characters allowed are the digits on the number keys").

Settings that worked: vertical frames `9:16`, sheets `16:9`, resolution `2k`, highest quality tier.

## Mascot sheet

Run this once on two or three models, look at all results side by side, pick the one whose line and shading are closest to the style block, and never change the mascot again.

```text
Character model sheet of an original <animal> mascot (the real animal), drawn as a 2D hand-drawn digital animation character.

STYLE: <style block, character part only>. Simple, clean, appealing shapes with solid construction.

CHARACTER: <build and correct anatomy in one sentence: skull, ears, muzzle, tail, paws>. Coat is flat <colour + hex> with a
darker shadow tone <hex> and a few <colour> light planes on <where>; a thin cream-white rim light on the lit side.
<Eye design: size, colour + hex, pupil shape, highlight, lid line>. Personality: <three words, and a comparison>.
No clothes, no collar, no accessories.

LAYOUT on a plain flat <pale colour + hex> background, evenly spaced, nothing overlapping. Top row, full body, same scale:
(1) sitting upright, front view; (2) standing, side view facing right; (3) sitting, three-quarter view, one front paw raised.
Bottom row, head close-ups, same size: (4) neutral confident; (5) half-lidded unimpressed stare; (6) wide-eyed curious;
(7) narrowed determined glare; (8) a single front paw seen from the side.

The same character in every drawing: identical colours, proportions, eye design and line style.
No text, no labels, no numbers, no watermark, no signature.
```

What "tidy and logical" means when judging: four legs, one tail, ears and eyes symmetrical, the same markings in every view, anatomy a child would recognise as that animal, expressions that read at thumbnail size. Anatomically correct pupils and ear shape for the species are cheap credibility.

Keep the design original. If the result looks like a known film or game character, re-roll with different eye and head shapes.

## Product sheet from photos

Best case: attach the owner's photos as references and ask for a redraw. If the photos are not available as files, describe every part from what you see. Either way, name parts in the order someone would assemble them and give sizes as **ratios** as well as units.

```text
Product model sheet of <what it is>, drawn in exactly the same 2D hand-drawn animation style as the reference image
(same bold dark ink outlines, same flat cel shading with one hard-edged shadow tone, same muted palette, same plain pale
background). Use the reference only for drawing style. Do NOT draw any animal.

THE PRODUCT (draw it accurately, it is a real product):
- <part 1>: <shape, size, material, colour, surface pattern, fixings>.
- <part 2>: <...>, about <ratio> of <part 1>'s width.
- <part N>: <...>. <Any display>: <how many windows, what colour digits>. <Any keypad>: <rows and columns, colours per row>.
  The area where the maker's mark sits is left blank: no logo, no brand name.

LAYOUT, evenly spaced, nothing overlapping or cropped: (1) large front three-quarter view; (2) straight front view;
(3) close-up of <the most detailed part> seen straight from the front.

No text, no labels, no brand names, no watermark. The only characters allowed are <digits that physically exist on it>.
```

Then compare against the photos part by part: count things (feet, bars, rows of keys), check relative heights, check colours. Correct with a second pass that attaches the first sheet and lists numbered corrections:

```text
Redraw this product model sheet of the same <product> in exactly the same drawing style, keeping every part of the design,
but with these corrections so it matches the real product:
1. TALLER <part>: ... the distance from <A> up to <B> is about 1.4 times the width of <A>. The whole product is clearly taller than it is wide.
2. <PART>: ...
```

In the worked example the first sheet had a pole about half its real height. "70 cm" alone did not fix it; "1.4 times the platform width" did.

## Supporting character sheet

Same template as the mascot, attached to the mascot sheet for style only ("Use the reference only for drawing style. Do NOT draw any animal."). Describe an *original* person: age band, build, hair, one or two distinctive features, clothes with colours, and the same eye design language. Ask for the expressions the story needs (stressed, shocked, relieved, proud). Add "Original design, not based on any real person or existing character."

## Key frames

Attach the relevant sheets (and the previous frame of the same location when continuity matters) and say which is which.

```text
A single 2D hand-drawn digital animation frame in the exact drawing style of the reference character sheet: <one-line style reminder>. Vertical 9:16.

SCENE: <location, time>. <Shot size and angle>. The <character> from the reference sheet (same <identifying features>) <action>.
<Second subject, described physically>. His/her/its expression is <specific>: <brows, mouth, one extra detail>.

BACKGROUND: <three or four concrete things>, all labels blank. <Light source and where it falls>.

COMPOSITION: <subject> around the vertical centre, <object> in the lower-middle. The upper quarter of the frame is calm
<what> (a headline will be added there later). Nothing important in the bottom fifth.

COLOUR: <only what matters for this shot>.

Clean flat colours, no film grain, no chromatic aberration, no blur. No text, no letters, no numbers, no logos, no watermark, no signature.
```

Product hero frame - add: "reproduced exactly with every part and the same proportions: <list the parts again>. No logo and no brand name anywhere on it." and "The whole product is visible from <bottom> to <top>, centred. The product fills roughly the middle 65 percent of the frame height."

Composition habits that save re-rolls:
- State percentages for where things sit; "leave room for text" alone is ignored.
- If something will leave the frame later (pushed off a table), say where the edge is: "the counter ENDS on the left side of the frame; beyond it is only dark empty floor."
- One action per frame.

## End frames (edits of a start frame)

```text
Recreate the first reference image exactly - same composition, same framing, same drawing, same line work, same colours,
same background, same position of <stable things> - with ONE change: <the change, described physically>.
<Any consequence of the change, e.g. stronger glow, a revealed patch of background>. Nothing else changes.
```

For bigger differences, number them ("Changes: 1. ... 2. ... Nothing else changes."). Check that the unchanged parts really are unchanged by putting the two frames side by side - a shifted background makes the interpolated clip swim.

## Plates for code overlays

When code will draw the exact part (digits, labels, logo), ask for a straight-on, perspective-free view with that part empty:

```text
... seen perfectly straight from the front in a flat orthographic view with NO perspective: <the face> is a clean
<shape> with horizontal top and bottom edges and vertical sides, centred, spanning about 86 percent of the frame width.
<The windows> are completely EMPTY and switched off: no digits, no segments, nothing inside them.
<The logo area> is an empty plain <colour> area (a logo will be added later): no logo, no brand name, no marks.
```

No perspective means your overlay is rectangles at coordinates you can read off with `tools/grid.py`.

## Animation prompts

Structure: style reminder → camera → the action in order → what must not change → exclusions.

```text
2D hand-drawn cel animation, flat colours, bold ink outlines, limited animation. Locked static camera, single continuous shot.
<Action as a sequence: first ..., then ..., then ...>. <What the secondary character does>. <Small life: a blink, a tail swish>.
The background stays perfectly still. No camera movement, no zoom, no cuts, no new objects, no text.
Keep the flat cel-shaded drawing style, the characters' designs and the line art perfectly consistent, no morphing.
```

- "Locked static camera" every time: you add camera moves in code, where they hit the beat.
- For comedy add "snappy comedic timing" and say what stays constant ("a deadpan look that never changes").
- For product shots add "The <product> stays solid and does not move or bend."
- For a living hold from a single start frame: one sentence of small motion per character, nothing else.
- 3 s for a single action, 5 s for a sequence. Longer clips drift.

## Reviewing what comes back

Look at every result before building on it. Images: view the review copy (`cache/view/`). Clips: read the contact sheet from `tools/clip_extract.py`, then open two or three frames at full size.

Reject and re-roll when you see:
- text, pseudo-letters or a logo anywhere;
- a ghost or blur of a reference image bleeding into the picture (seen when a model is asked to use a reference "for style only" - switch model for that job);
- the product missing a part, or with the wrong count of something;
- the character off-model (eye shape, colour, proportions) compared with the sheet;
- in clips: limbs appearing or merging, a face that changes, a background that slides, an unrequested camera move, the action not completing.

One re-roll with a more specific prompt is normal. Two failures means the shot is asking for too much: split it, use start + end frames, or do it as a still animated in code.
