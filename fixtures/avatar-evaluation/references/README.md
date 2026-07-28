# Synthetic avatar evaluation references

These four images are versioned evaluation fixtures for Epic 11.1. They were generated with the
built-in OpenAI image generation tool on 2026-07-27, contain no real user content, and were
visually reviewed before inclusion.

## Usage and license

- Purpose: provider and prompt-profile evaluation for identity preservation, couple separation,
  and constrained image editing.
- Provenance: fully synthetic; no source photo or production user data was used.
- License: CC0-1.0. The project dedicates these generated fixture files to the public domain.
- Privacy: EXIF and other metadata were stripped after conversion.
- Format: 1024×1024 JPEG, quality 90.
- Generated outputs derived from these fixtures remain gitignored under `avatar-eval-results/`.

## Files

| Fixture ID | File | Role | SHA-256 |
| ---------- | ---- | ---- | ------- |
| `synthetic-person-a-front` | `synthetic-person-a-front.jpg` | Person A frontal reference | `76277f764d886b949bc6ed8b3f22d88bff58297a0225bf43a36a8de252b1a9ea` |
| `synthetic-person-a-profile` | `synthetic-person-a-profile.jpg` | Person A three-quarter reference | `ffd55a0caf0b5464fb2d804e7b3f8884224f7e7c6f750675698789032e255c19` |
| `synthetic-person-b-front` | `synthetic-person-b-front.jpg` | Person B frontal reference | `56fe75b3524007a0e0a9a02d21212bf07deb4ad03517221ddf6f4b4df0536b9f` |
| `synthetic-edit-parent` | `synthetic-edit-parent.jpg` | Parent image for constrained edits | `64191ce2e513b8ac83d2155763431cd57e19a7863e24a6b71feae2857d0bdc13` |

## Generation prompts

### Person A — frontal

```text
Use case: photorealistic-natural
Asset type: privacy-safe synthetic evaluation fixture for an open-source avatar generator
Primary request: create a completely fictional adult person, Person A, for identity-preservation testing. This person must not resemble a known or real individual.
Subject: East Asian-presenting adult in their early 30s, oval face, warm medium skin tone, short softly textured black hair, dark brown eyes, subtle friendly closed-mouth expression, wearing a plain charcoal crew-neck shirt with no logo.
Scene/backdrop: perfectly plain neutral light-gray studio background.
Style/medium: highly realistic but clearly synthetic studio portrait photography, natural skin texture.
Composition/framing: square 1:1, straight-on frontal head-and-shoulders passport-like reference, face centered, both ears visible, shoulders level, generous crop margin.
Lighting/mood: soft even daylight-balanced studio lighting, neutral and calm, no dramatic shadows.
Constraints: one adult only; face fully visible; no glasses, jewelry, hat, facial hair, makeup emphasis, text, logos, watermark, props, blur, depth-of-field blur, or background texture. Preserve distinctive but natural facial features suitable for matching to a later profile view.
```

### Person A — three-quarter profile

The frontal image above was the identity reference for this edit.

```text
Use case: identity-preserve
Asset type: second privacy-safe synthetic evaluation fixture for the same fictional Person A shown in the immediately preceding image
Primary request: create a right-facing three-quarter profile portrait of exactly the same fictional person. Preserve identity precisely: same facial proportions, eyes, nose, mouth, jawline, ears, skin tone, hairline, hairstyle, age, shirt, and neutral closed-mouth expression.
Scene/backdrop: same perfectly plain neutral light-gray studio background.
Style/medium: same highly realistic synthetic studio portrait photography and natural skin texture.
Composition/framing: square 1:1 head-and-shoulders portrait, person turned about 45 degrees to camera-right, both eyes still visible, face unobstructed, centered with generous crop margin.
Lighting/mood: same soft even daylight-balanced studio lighting.
Constraints: change only head orientation from frontal to three-quarter profile; one adult only; no new accessories, glasses, jewelry, hat, facial hair, text, logo, watermark, props, blur, or background variation.
```

### Person B — frontal

```text
Use case: photorealistic-natural
Asset type: privacy-safe synthetic evaluation fixture for an open-source avatar generator
Primary request: create a completely fictional adult person, Person B, visually distinct from Person A and not resembling any known or real individual.
Subject: Black-presenting woman in her late 30s, deep brown skin, softly angular face, dark brown eyes, natural short coiled hair, subtle confident closed-mouth expression, wearing a plain muted burgundy crew-neck top with no logo.
Scene/backdrop: perfectly plain neutral light-gray studio background.
Style/medium: highly realistic but clearly synthetic studio portrait photography, natural skin texture.
Composition/framing: square 1:1, straight-on frontal head-and-shoulders passport-like reference, face centered, both ears visible where hair permits, shoulders level, generous crop margin.
Lighting/mood: soft even daylight-balanced studio lighting, neutral and calm, no dramatic shadows.
Constraints: one adult only; face fully visible; no glasses, jewelry, hat, text, logos, watermark, props, blur, depth-of-field blur, or background texture. Strong identity separation from the previously generated Person A.
```

### Edit parent

```text
Use case: photorealistic-natural
Asset type: privacy-safe synthetic edit-parent fixture for conversational avatar editing tests
Primary request: create a completely fictional adult person, distinct from all prior fixtures and not resembling any known or real individual.
Subject: South Asian-presenting woman in her early 40s, medium-brown skin, softly rounded face, dark brown eyes, shoulder-length wavy dark hair, neutral closed-mouth expression, wearing a plain navy blouse with no logo.
Scene/backdrop: realistic home-office background with a light wood shelf, two small books, one green plant, and a desk lamp; moderately visible background detail so removal or replacement can be evaluated, but no readable text.
Style/medium: highly realistic but clearly synthetic environmental portrait photography, natural skin and hair texture.
Composition/framing: square 1:1, straight-on centered head-and-shoulders portrait, face fully visible, shoulders level, enough background visible around the subject.
Lighting/mood: soft window light with balanced fill, approachable and neutral.
Constraints: one adult only; no glasses, jewelry, hat, text, logos, watermark, blur, extreme depth of field, dramatic shadows, or cropped hair. This image will be the fixed parent for tests that change only background or expression while preserving identity, hair, clothing, and framing.
```
