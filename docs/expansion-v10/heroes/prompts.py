#!/usr/bin/env python3
"""Héroes de Ciempi (10 conjuntos × 4 piezas): escribe los prompts de IA en ia/prompts/ y
ia/encargos.tsv (id, prompt, referencias) para generar.sh. Plantillas = las del Capitán Ciempi
(docs/expansion-v9/capitan-cometa/ia/prompts), con la referencia de formato de cada categoría.
Uso (desde la raíz): python3 docs/expansion-v10/heroes/prompts.py
"""
import os

AQUI = os.path.dirname(os.path.abspath(__file__))
REF = 'docs/expansion-v10/heroes/ia/referencias/'
CIEMPI = REF + 'ciempi-sin-gorro.png'
NAVY = '#243e5b'
COMUN_NO = 'No letters, no numbers, no logos or symbols from existing franchises or brands.'

ANTIFAZ = (
    'ONE isolated premium children\'s cartoon superhero MASK accessory for the cartoon caterpillar Ciempi in reference 1, '
    'real transparent background including two large transparent eye holes. Reference 1 is only for navy outlines ({navy}), '
    'light direction and round-face perspective. Reference 2 is ONLY a format reference for size, view and eye-aperture '
    'placement of a half mask; do not copy its dragon design or colors. Draw an ORIGINAL mask for a friendly hero called "{nombre}": '
    '{desc} Two big EMPTY eye apertures, no eyes, no irises, no skin, no face, no mouth, no head or character. Left aperture '
    'slightly larger and lower, right aperture slightly smaller and higher, matching the reference character\'s eyes. The mask leaves '
    'the mouth and cheeks uncovered. {no} Smooth 2D cartoon illustration with rich stylized highlights upper left and soft shaded '
    'volume lower right, friendly and heroic, no aggressive or scary shapes. Entire accessory visible with transparent margins. '
    'No strings across the holes, no black fill inside holes, no background or glowing aura. Clean production sprite ready to '
    'overlay the original character\'s eyes.')

GORRO = (
    'Generate ONE polished isolated 2D cartoon children\'s head accessory for an ORIGINAL friendly hero costume called "{nombre}", '
    'for the cartoon caterpillar Ciempi in reference 1. Reference 1 is style/angle reference only; draw NO character, head, body, '
    'face or eyes. Reference 2 is ONLY a format reference for how a cap sits on Ciempi\'s big round head (size, three-quarter '
    'frontal view, open lower rim); do not copy its knitted dragon design, ears or face. {desc} The lower rim is an open curved '
    'edge that rests on the upper forehead, so the wearer\'s eyes, cheeks and mouth stay completely visible. {no} Navy contours '
    '({navy}) consistent with reference, upper-left lights, soft lower-right shading, charming tactile volume, clean stylized '
    'materials without photographic noise. Entire accessory with transparent margin, true transparent background. No text, '
    'background, ground shadow, hanger or mannequin. Finished game sprite.')

TRAJE = (
    'Create an illustrated MATERIAL ATLAS for the segmented BODY suit of an ORIGINAL friendly superhero costume called "{nombre}", '
    'using the navy outlines ({navy}) and soft cartoon 2D finish of Ciempi in reference 1. Reference 2 is ONLY a format reference '
    '(3x2 grid of full-bleed swatches with round volume); do not copy its robot armor or its colors. Palette: {paleta}. '
    'A seamless arrangement of exactly 3 columns and 2 rows of square FULL-BLEED artwork panels, no margins, no separators, no '
    'text, no labels. Each square is a DIFFERENT close-up of the suit wrapping a convex round surface; fill the entire square with '
    'material, no surrounding background, no discs outlined on backgrounds. {tiles} Every tile has illumination upper left and '
    'deep round volume lower right, large soft seams and gentle sheen. {no} No face, no eyes, no limbs, no body silhouette. The '
    'six neighboring squares are distinct usable texture swatches, not six identical images. Landscape 3:2 sheet.')

BOTAS = (
    'Create ONE isolated chunky children\'s superhero boot for an ORIGINAL friendly costume called "{nombre}", in the illustration '
    'language of Ciempi in reference 1. Reference 2 is ONLY a format reference for view, size, opening and proportions; do not copy '
    'its design or colors. Single boot, toe points RIGHT, side view with slight top visibility like Ciempi\'s original sneakers. '
    'Low calf, round open ankle cuff toward LEFT, foot opening visible, thick sole. {desc} Intentional clean soft rounded forms '
    'with rounded navy contours ({navy}), upper-left light, deep softer shadows and clear volume. {no} No leg, no pair, no character, '
    'no background or ground shadow. Real transparent background. Full boot with generous empty margins. Render at high resolution.')

MOCHILA = (
    'Create ONE isolated {objeto} worn on the back, for an ORIGINAL friendly superhero costume called "{nombre}", for cartoon '
    'caterpillar Ciempi in reference 1. Reference 2 is ONLY a format reference for view, size and finish of a back-worn object '
    'without straps; do not copy its design or colors. {desc} Clear side thickness. Three-quarter side view, object faces camera '
    'with right side receding. NO straps, no handles, no loops, no buckles: only the closed body of the object with a clean '
    'continuous navy outline (straps are added later in the game). Navy blue outlines ({navy}) matching Ciempi, upper-left '
    'highlights and lower-right shadows, polished 2D illustrated volume, not photorealistic. {no} No character, no limbs, no '
    'ground shadow, no white background. Genuine transparent background. Entire object fully visible, centered with transparent margins.')

CAPA = (
    'Use case: stylized-concept. Produce ONE finished isolated costume cape asset for an ORIGINAL friendly hero called "{nombre}", '
    'for the cartoon caterpillar in reference image 1. Reference image 2 is the mandatory construction guide: reproduce its '
    'wind-swept cloth construction, broad billowing upper wave, thick rounded hem, deep shaded fold, flowing leftward from an '
    'attachment at the right; do not copy its colors. Render ONLY the cape, without caterpillar, head, body, feet, hat, eyes, '
    'background or ground shadow. This is a transparent sprite for compositing onto the EXACT original character later. Cape '
    'front/near-side panel sweeps to the LEFT, neck attachment at far RIGHT. {desc} Dark navy rounded contours ({navy}) matching '
    'Ciempi, professional children\'s cartoon 2D, smooth controlled shading, no texture noise. {no} Keep generous transparent '
    'margin, entire cape uncut. Do not draw any anatomy, wearer, mannequin, text or scenery. Maintain the reference\'s horizontal '
    'construction, not a vertical triangular cloak. Transparent background with real alpha.')

CAPUCHA = (
    'ONE isolated premium children\'s cartoon FULL-HEAD superhero HOOD MASK for the cartoon caterpillar Ciempi in reference 1, '
    'real transparent background including two large transparent eye holes. Reference 1 shows the big ROUND head this mask must '
    'wrap; use it for navy outlines ({navy}), light direction and round-face perspective. Reference 2 is ONLY a format reference '
    'for size and view of a mask that wraps a whole round head; do not copy its robot design, colors or its drawn eyes. Draw an '
    'ORIGINAL full-head mask for a friendly hero called "{nombre}": a soft ROUND fabric hood that covers the entire round head '
    '(top, forehead, sides and cheeks), its outline following the circle of the head; the lower edge is a gentle smiling curve just '
    'ABOVE the mouth, so the mouth and chin stay uncovered. {desc} Two big EMPTY eye apertures cut through the hood (transparent '
    'holes), no eyes, no irises, no lenses, no white eye panels, no skin, no face, no mouth, no character. Left aperture slightly '
    'larger and lower, right aperture slightly smaller and higher, matching the reference character\'s eyes. Two small round holes '
    'at the top for the antennae. {no} Smooth 2D cartoon illustration with soft fabric volume, highlights upper left and shading '
    'lower right, friendly and cute, no scary or aggressive shapes. Entire hood visible with transparent margins, no background, '
    'no glow. Clean production sprite ready to overlay the original character\'s head.')

COMPLETA = (
    'ONE isolated premium children\'s cartoon FULL-FACE costume HEAD MASK for the cartoon caterpillar Ciempi in reference 1, real '
    'transparent background. Reference 1 shows the big ROUND head this mask must cover; use it for navy outlines ({navy}), light '
    'direction and round-face perspective. Reference 2 is ONLY a format reference for a full-face mask that covers a whole round '
    'head and has its own drawn friendly face (size, view, construction); do not copy its robot design or colors. Draw an ORIGINAL '
    'full-face mask for a friendly character called "{nombre}": {desc} The mask outline follows the circle of the head. {no} Smooth '
    '2D cartoon illustration with soft volume, highlights upper left and shading lower right, CUTE, friendly and kid-safe, never '
    'scary or aggressive. Entire mask visible with transparent margins, no body, no neck, no background, no glow. Clean production '
    'sprite ready to overlay the original character\'s head.')

ESPALDA = (
    'Create ONE isolated {objeto} worn on the back, for an ORIGINAL friendly costume called "{nombre}", for the cartoon caterpillar '
    'Ciempi in reference 1 (side view: the caterpillar faces RIGHT, its head on the right, its body extends to the left). Reference 2 '
    'is ONLY a scale and side-view reference for a back accessory; do not copy its design or colors. {desc} Navy outlines ({navy}) '
    'matching Ciempi, upper-left highlights, soft lower-right shading, polished 2D illustrated volume, not photorealistic. {no} No '
    'character, no body, no limbs, no ground shadow, no background. Genuine transparent background. Entire object fully visible with '
    'transparent margins.')

FORMATO = {'completa': 'formato-mascara-robot.png', 'espalda': 'formato-capa-heroica.png', 'capucha': 'formato-mascara-robot.png', 'antifaz': 'formato-antifaz-dragon.png', 'gorro': 'formato-gorro-dragon.png', 'traje': 'formato-atlas-robot.png',
           'botas': 'formato-bota-robot.png', 'mochila': 'formato-propulsor-robot-sin-correas.png', 'capa': 'formato-capa-heroica.png'}

# slug: (nombre, piezas{tipo: (plantilla, kwargs)})
H = {
 'coloso': ('Ciempi Coloso', [
  ('cabeza', 'gorro', dict(desc='A short snug cap in INTENSE GREEN (#3aa53c to #5cc94a) hugging the top of the round head, with a strip of messy BLACK hair made of FIVE thick pointed tufts that stick slightly upward along the crown, the hair with dark grey highlights and navy outlines. Two small round openings at the top for the antennae.')),
  ('traje', 'traje', dict(paleta='INTENSE GREEN (#3aa53c to #5cc94a) padded suit fabric with darker green (#24782f) curved lines that suggest big rounded friendly muscles, and DARK PURPLE (#4b2a6b) cloth with small black folds',
     tiles='Top left: green with two big rounded darker green muscle curves and a dark purple band at the bottom with an irregular torn-cloth edge. Top middle: green with one large rounded muscle curve and soft shadow. Top right: green with curved muscle lines and a purple ragged lower band with small black folds. Bottom left: green with gentle rounded muscle curves. Bottom middle: green chest panel with two big rounded chest-muscle curves, no emblem, purple torn band at the bottom. Bottom right: green with a purple torn-cloth band crossing the lower third.')),
  ('botas', 'botas', dict(desc='BIG chunky boot in DARK PURPLE (#4b2a6b) with a wide rounded toe, an INTENSE GREEN (#3aa53c) band around the top of the cuff and two small folds suggesting tough fabric. Thick BLACK sole slightly protruding all around. White highlights on the toe and soft shadows at the base.')),
  ('espalda', 'mochila', dict(objeto='BACKPACK', desc='The backpack is DARK GREEN (#2c6a34) shaped like a rounded boulder, decorated with small PURPLE (#6a3b94) cracks and three raised reliefs that look like overlapping smooth stones. In the center, one small round BRIGHT GREEN (#5cc94a) medallion with a soft rim. Friendly, rounded, not threatening.')),
 ]),
 'aracnido': ('Ciempi Arácnido', [
  ('cabeza', 'capucha', dict(desc='Color: the TOP half of the hood is bright RED (#d8343a) and a wide ELECTRIC BLUE (#2a6fdb) band wraps the lower part over the cheeks. NO web lines at all on the hood: smooth fabric with a few soft curved seams. Each eye aperture has a thick ROUND dark navy rim. On the forehead, a small cute emblem: a red central circle with eight short CURVED black legs around it, simple and rounded like a friendly cartoon bug.')),
  ('traje', 'traje', dict(paleta='bright RED (#d8343a) on the upper half and ELECTRIC BLUE (#2a6fdb) on the lower half of the suit, with a few sparse thin black curved arcs on the red areas (playful woven-hammock motif, not a dense web grid)',
     tiles='Top left: red upper half with two or three thin black curved arcs, electric blue lower half with darker shadows near the edges and small white highlights. Top middle: red with a few thin black arcs fanning from one corner, following the volume. Top right: blue with darker blue edge shadows and a red top cap with web lines. Bottom left: red and blue split along a gentle curve, one black arc on the red. Bottom middle: chest panel, red with an ORIGINAL small emblem: a red central circle with eight short CURVED black legs around it (simple, rounded, cute), blue lower half. Bottom right: alternate red-over-blue panel with one or two thin arcs.')),
  ('botas', 'botas', dict(desc='Fitted glossy RED (#d8343a) boot with a rounded toe and thin BLACK lines forming small web patterns on the surface. DARK BLUE sole (#1d3a7a) and an ELECTRIC BLUE (#2a6fdb) stripe on the back of the heel/cuff. Shiny surface with white highlights.')),
  ('espalda', 'mochila', dict(objeto='compact BACKPACK', desc='A compact OVAL backpack, upper part RED (#d8343a) and lower part ELECTRIC BLUE (#2a6fdb). In the center, a BLACK circle with several SILVER lines radiating to the sides forming a geometric net. On each side one small curved WHITE tube, like a decorative thread dispenser.')),
 ]),
 'ilusionista': ('Ciempi Ilusionista', [
  ('cabeza', 'gorro', dict(desc='A decorative GOLDEN (#e6b23a with yellow #ffd75a highlights) helmet-crown that covers the top of the round head, with TWO LARGE CURVED ornaments rising toward the upper sides like soft swept horns, ending in ROUNDED tips. The central forehead area is EMERALD GREEN (#1f8a5b) with one small OVAL GOLD gem. Open at the bottom. Small gaps at the top for the antennae. Elegant and friendly, not scary.')),
  ('traje', 'traje', dict(paleta='dark EMERALD GREEN (#1f8a5b to #146b45) satin fabric with GOLD (#e6b23a) diagonal stripes and small gold geometric diamonds and curved lines, plus a BLACK tunic band',
     tiles='Top left: emerald with one gold diagonal stripe and small gold diamonds. Top middle: emerald with gold curved lines and satin light-green highlights. Top right: emerald with two thin gold diagonal stripes and a black band at the bottom. Bottom left: emerald with small gold diamond pattern, black lower band like an elegant tunic. Bottom middle: chest panel, emerald with a gold diagonal sash and one small gold diamond motif, black lower band. Bottom right: emerald with curved gold lines and deep satin shadows.')),
  ('botas', 'botas', dict(desc='Short DARK GREEN (#14593a) boot with GOLD (#e6b23a) edges along the cuff, a slightly elongated but ROUNDED toe with one small golden TRIANGULAR piece on the front, and a BLACK sole. Soft green highlights, satin finish.')),
  ('espalda', 'capa', dict(desc='An EMERALD GREEN cape: outer face dark green (#146b45), inner lining GOLD (#e6b23a) visible in the folds. The lower hem has small soft rounded POINTS and a continuous gold trim. Fastened at the neck by TWO round GREEN clasps with gold rims.')),
 ]),
 'solar': ('Ciempi Solar', [
  ('cabeza', 'antifaz', dict(desc='an INTENSE BLUE (#2f6fe0) eye mask that wraps the forehead and the eyes, with a RED (#e03a32) band along its upper part. In the center of the forehead, an ORIGINAL round emblem: a small GOLDEN (#f5c23a) CIRCULAR sun-disc badge with a bold, rounded, friendly RED letter S in its center (S for Solar). The badge is a plain CIRCLE, not a diamond, not a pentagon, not a shield shape. Thick blue rims around the two wide apertures, small white highlights.')),
  ('traje', 'traje', dict(paleta='ELECTRIC BLUE (#2f6fe0) stretchy suit fabric with darker blue (#1f4fb0) curved fold lines, a wide RED (#e03a32) lower band edged with thin YELLOW (#f5c23a), and a small round golden badge with a red letter S',
     tiles='Top left: blue with two darker curved fold lines. Top middle: blue with fold lines and a wide red lower band with a thin yellow edge. Top right: blue with gentle stretch folds. Bottom left: blue with a red band edged in yellow. Bottom middle: chest panel, blue with ONE ORIGINAL round emblem: a small GOLDEN CIRCULAR sun-disc badge with a bold rounded friendly RED letter S in its center (S for Solar); a plain circle, not a diamond, pentagon or shield shape; red lower band with yellow edge. Bottom right: blue with darker curved folds and red/yellow band.')),
  ('botas', 'botas', dict(desc='Glossy BRIGHT RED (#e03a32) boot with a short calf, a rounded toe, a YELLOW (#f5c23a) trim around the top of the cuff, a DARK RED (#9c2222) sole and a small curved yellow line on the side. Big white highlights on the toe.')),
  ('espalda', 'capa', dict(desc='A BRIGHT RED (#e03a32) cape, wide with rounded corners and a slight wave as if moving in the wind. Inner lining DARK RED (#9c2222), soft highlights on the outer face. Fastened at the neck by TWO round GOLD (#f5c23a) clasps.')),
 ]),
 'nocturno': ('Ciempi Nocturno', [
  ('cabeza', 'antifaz', dict(desc='a BLACK (#23252d) cowl mask that covers the top of the round head and surrounds the eyes, with TWO TALL TRIANGULAR EARS at the upper corners, tips slightly rounded and leaning outward. A small DARK GREY (#4a4f5c) band across the forehead. Thick black rims around the eye apertures. Dark blue (#3a5a8c) highlights so the black reads clearly. The lower face stays uncovered.')),
  ('traje', 'traje', dict(paleta='GRAPHITE GREY (#4a4f5c) fitted suit fabric with lighter grey (#7a808e) central zones, curved BLACK (#23252d) stripes and edges, and YELLOW (#f2c230) accents',
     tiles='Top left: graphite with a lighter grey center and curved black side stripes. Top middle: graphite with black edges and soft dark-blue sheen. Top right: grey with a black belt band at the bottom carrying small YELLOW compartments. Bottom left: graphite with curved black stripes. Bottom middle: chest panel, light grey center with an ORIGINAL small emblem: two simple geometric wings inside a YELLOW circle, black belt with small yellow compartments below. Bottom right: graphite with black curved edges.')),
  ('botas', 'botas', dict(desc='BLACK (#23252d) boot with a short calf and rounded toe, a thick DARK GREY (#4a4f5c) sole, three small diagonal LIGHT GREY lines on the side and a very thin YELLOW (#f2c230) trim on the top edge. Dark blue highlights so the black reads clearly.')),
  ('espalda', 'capa', dict(desc='A long BLACK (#23252d) cape of soft fabric with a DARK GREY (#4a4f5c) inner lining. Its lower hem is formed by FIVE ROUNDED WAVES (scalloped edge). Two small YELLOW (#f2c230) round clasps at the neck, dark blue (#3a5a8c) highlights on the folds so the black reads clearly.')),
 ]),
 'bromista': ('Ciempi Bromista', [
  ('cabeza', 'gorro', dict(desc='A soft fabric hat in BRIGHT GREEN (#5cc84a) with THREE decorative DARK GREEN (#2f8a35) tufts that stick out toward the back. The base band is PURPLE (#7a3db8) with a small WHITE stripe crossing the forehead. Two round PURPLE pompoms hang slightly at the lower sides, outside the eyes. Playful and friendly.')),
  ('traje', 'traje', dict(paleta='INTENSE PURPLE (#7a3db8) jacket fabric with BRIGHT GREEN (#5cc84a) diagonal lapel stripes, small YELLOW (#f5c23a) buttons, a WHITE shirt stripe and DARK GREEN lower borders',
     tiles='Top left: purple with two green diagonal lapel stripes. Top middle: purple with soft volume sheen and a dark green lower border. Top right: purple with one green diagonal lapel. Bottom left: purple with small yellow buttons in a row. Bottom middle: chest panel, purple jacket with two green lapels opening onto a WHITE shirt stripe with small YELLOW buttons, dark green lower border. Bottom right: purple with green lapel and gentle folds.')),
  ('botas', 'botas', dict(desc='PURPLE (#7a3db8) boot with a rounded BRIGHT GREEN (#5cc84a) toe cap, a thick BLACK sole, small YELLOW laces, a WHITE band around the top of the cuff and two round GREEN buttons on the side.')),
  ('espalda', 'mochila', dict(objeto='BACKPACK', desc='A PURPLE (#7a3db8) backpack shaped like a ROUNDED BOX, decorated with BRIGHT GREEN (#5cc84a) stripes and small YELLOW buttons. On top, a small curly spring with a chunky YELLOW STAR with rounded tips popping out of it, like a surprise toy.')),
 ]),
 'esmeralda': ('Ciempi Esmeralda', [
  ('cabeza', 'antifaz', dict(desc='an EMERALD GREEN (#2fc46a) eye mask, elongated toward the sides, with thick BLACK edges and small WHITE decorative zones. In the center of the forehead, a small glowing GREEN circle framed by two curved SILVER lines.')),
  ('traje', 'traje', dict(paleta='BRIGHT GREEN (#2fc46a) on the upper part and INTENSE BLACK (#1d1f26) on the lower part, separated by a thin WHITE band, with darker green curved lines and luminous highlights',
     tiles='Top left: green upper, black lower, a thin white curved band between them. Top middle: green with darker green curved lines and luminous highlights. Top right: black with a thin white band and a green upper edge. Bottom left: green over black with a white separating band. Bottom middle: chest panel, green upper part with an ORIGINAL emblem: a GREEN HEXAGONAL CRYSTAL in a small WHITE frame, black lower part. Bottom right: green with curved darker lines and a glowing sheen.')),
  ('botas', 'botas', dict(desc='BRIGHT GREEN (#2fc46a) boot with a rounded toe and BLACK sole, a thick WHITE band around the top of the cuff and two LIGHTER GREEN lines on the side suggesting energy. Small white highlights for a polished finish.')),
  ('espalda', 'mochila', dict(objeto='round BACKPACK', desc='A CIRCULAR DARK GREEN (#14663a) backpack with a large BRIGHT GREEN crystal in the center surrounded by a WHITE frame, and FOUR small GREEN lights placed symmetrically around it. LIGHT GREEN outer rim. A soft gentle glow around the crystal only (no aura outside the object).')),
 ]),
 'sombra': ('Ciempi Araña Sombra', [
  ('cabeza', 'capucha', dict(desc='Color: INTENSE BLACK (#1d1f26) with dark blue (#3a5a8c) highlights so the black reads clearly. Each eye aperture is surrounded by a WIDE RED (#e8263a) OVAL frame whose outer end tilts slightly upward. A few thin RED curved arcs on the black surface (sparse, not a dense web). The hood is SHORTER at the bottom: its lower edge passes just BELOW THE EYE APERTURES, leaving a WIDE open area for the mouth, cheeks-bottom and chin (the whole mouth must stay completely visible). On the forehead, a small cute RED spider emblem: a red central circle with eight short CURVED legs around it, simple and rounded.')),
  ('traje', 'traje', dict(paleta='INTENSE BLACK (#1d1f26) fabric with a few sparse bright RED (#e8263a) curved arcs (a playful woven-net motif, not a dense web grid), DARK GREY (#3c404b) lower stripes and red reflections',
     tiles='Top left: black with two red curved arcs following the volume. Top middle: black with three thin red arcs fanning from one corner and dark grey lower stripes. Top right: black with one red arc and red sheen. Bottom left: black with a red arc and small grey lower stripes. Bottom middle: chest panel, smooth black with ONE ORIGINAL cute RED spider emblem: a red central circle with eight short CURVED red legs around it, simple and rounded (same style as a friendly cartoon bug badge). Bottom right: black with two red arcs and dark grey stripes.')),
  ('botas', 'botas', dict(desc='BLACK (#1d1f26) boot with a bright RED (#e8263a) sole that has black relief grooves, a rounded toe, two red diagonal lines on the side and a small DARK GREY band at the back. A small red highlight on the heel and dark blue highlights so the black reads clearly.')),
  ('espalda', 'mochila', dict(objeto='compact BACKPACK', desc='A compact BLACK (#1d1f26) backpack shaped like a VERTICAL OVAL, with FOUR RED (#e8263a) diagonal stripes and a small glowing RED circle in the center. Two DARK GREY side pockets. Flexible fabric finish with rounded edges, dark blue highlights.')),
 ]),
 'travieso': ('Ciempi Travieso', [
  ('cabeza', 'capucha', dict(desc='Color: CRIMSON RED (#c41e3a) padded fabric. Around each eye aperture, a LARGE BLACK OVAL patch, the aperture itself round. On top, curved black seams and a DARKER RED stripe running down the center of the forehead. Playful and friendly.')),
  ('traje', 'traje', dict(paleta='CRIMSON RED (#c41e3a) thick padded fabric with BLACK (#1d1f26) diagonal side panels, curved seams, and a black belt with small GREY (#5a5f6b) rectangular compartments',
     tiles='Top left: crimson with a black diagonal side panel and curved seams. Top middle: crimson with curved seams and dark shadows. Top right: crimson with a black lower belt band with small grey rectangles. Bottom left: crimson with black diagonal panel. Bottom middle: chest panel, crimson with curved seams, black belt with small grey compartments below, no emblem. Bottom right: crimson with a black diagonal panel and thick fabric volume.')),
  ('botas', 'botas', dict(desc='Wide rounded BLACK (#1d1f26) boot with a bright RED (#c41e3a) toe cap and a DARK GREY (#4a4f5c) sole. A red band at the top of the cuff and two small black decorative straps. White highlights on the toe.')),
  ('espalda', 'mochila', dict(objeto='BACKPACK', desc='A BLACK (#1d1f26) RECTANGULAR backpack with rounded corners, two RED (#c41e3a) side pockets and a round RED clasp closing the central pocket. On top, two small soft FOAM-GREY toy batons with fully rounded ends, each in its own little compartment (soft toys, not weapons).')),
 ]),
 'garra': ('Ciempi Garra Salvaje', [
  ('cabeza', 'antifaz', dict(desc='a YELLOW (#f6c21c) mask covering the forehead and surrounding the eyes. On both sides, two LARGE DARK BLUE (#1f3a7a) ornaments rise diagonally upward like swept fins and end in SOFT rounded points. The forehead center is bright yellow with one vertical BLACK stripe. Thick blue rims around the eye apertures. Small notches at the top for antennae.')),
  ('traje', 'traje', dict(paleta='bright YELLOW (#f6c21c) suit fabric with large DARK BLUE (#1f3a7a) diagonal stripes, a lighter yellow central panel, three curved BLACK seam lines and a blue lower band with small black details',
     tiles='Top left: yellow with a big dark blue diagonal stripe. Top middle: yellow with a lighter yellow central panel and curved black seams. Top right: yellow with two blue diagonal stripes and a blue lower band. Bottom left: yellow with a blue diagonal stripe and small black details on a blue lower band. Bottom middle: chest panel, lighter yellow center with THREE curved black seam lines, dark blue diagonal stripes at both sides. Bottom right: yellow with a blue diagonal stripe and soft volume.')),
  ('botas', 'botas', dict(desc='DARK BLUE (#1f3a7a) boot with a bright YELLOW (#f6c21c) toe cap and a BLACK sole, three small parallel GREY lines on the front as reinforcements, a YELLOW top edge on the cuff and a BLACK diagonal stripe on the side. Glossy finish with thick contours.')),
  ('espalda', 'mochila', dict(objeto='BACKPACK', desc='A YELLOW (#f6c21c) backpack shaped like a ROUNDED SHIELD with DARK BLUE (#1f3a7a) edges. In the center, on a dark blue base, THREE elongated SILVER ornaments, parallel and slightly curved, with COMPLETELY ROUNDED tips (soft, not sharp), with white highlights.')),
 ]),
 'trueno': ('Ciempi Trueno', [
  ('cabeza', 'capucha', dict(desc='It is a SILVER HELMET (not fabric) made of smooth rounded metal plates with strong white highlights and navy edges, covering about 80 % of the head. A DARK NAVY BLUE (#1e2f5c) stripe runs along the top from the forehead backward. On both sides, two small curved SILVER WING ornaments sweep backward, each with three decorative divisions. The two round eye apertures have thick SILVER frames.')),
  ('traje', 'traje', dict(paleta='MIDNIGHT BLUE (#1e2f5c) sturdy suit fabric with large round SILVER discs, small blue diagonal stitch lines, a wide BLACK lower band separated by a thin silver line, and small GOLDEN geometric lightning bolts',
     tiles='Top left: midnight blue with two large round silver discs with white highlights and black rims near the top, small diagonal blue stitches between them. Top middle: midnight blue with blue diagonal stitches and a black lower band with a thin silver line. Top right: blue with one silver disc and a small golden geometric bolt. Bottom left: blue over a wide black band separated by a thin silver line. Bottom middle: chest panel, midnight blue with two round silver discs and ONE small original GOLDEN geometric lightning bolt between them, black lower band. Bottom right: blue with stitches and a small golden bolt.')),
  ('botas', 'botas', dict(desc='BLACK (#23252d) short boot with a rounded SILVER toe cap, a DARK NAVY BLUE band around the ankle, a thick GRAPHITE GREY sole with three visible divisions and small SILVER lightning-bolt ornaments on the side. White highlights on the toe and bluish shadows on the sides.')),
  ('espalda', 'capa', dict(desc='An INTENSE RED (#d8343a) cape of thick fabric with soft folds: outer face bright red, inner lining WINE RED (#7a1f2b). Fastened at the neck by TWO round SILVER clasps joined by a small DARK NAVY band. Pinned on the cape, a small TOY HAMMER decoration with a rectangular silver-grey head with rounded corners and a short brown handle (a cute toy, soft and rounded).')),
 ]),
 'relampago': ('Ciempi Relámpago', [
  ('cabeza', 'capucha', dict(desc='Color: glossy bright RED (#e0322e) fabric with small curved darker red seams following the round shape. On both sides of the head, two YELLOW (#ffcf2e) lightning-bolt ornaments sweep backward, with soft tips and golden edges. Each eye aperture has a red OVAL frame. On the forehead, a small WHITE circle with a geometric YELLOW lightning bolt. The lower edge leaves a WIDE opening so the smiling mouth is fully visible.')),
  ('traje', 'traje', dict(paleta='INTENSE RED (#e0322e) suit fabric with YELLOW (#ffcf2e) zigzag stripes, garnet shadows near the edges, big white highlights on top and a DARK RED belt band',
     tiles='Top left: red with two yellow zigzag stripes running diagonally. Top middle: red with garnet edge shadows and a big white highlight. Top right: red with one yellow zigzag and a dark red flexible belt band at the bottom. Bottom left: red with a yellow zigzag stripe. Bottom middle: chest panel, red with ONE small WHITE circle crossed by a broken YELLOW line, dark red belt band below. Bottom right: red with yellow zigzag and garnet shadows.')),
  ('botas', 'botas', dict(desc='Glossy bright YELLOW (#ffcf2e) boot with a rounded toe, a DARK RED (#9c2222) sole and a RED trim around the top of the cuff. On the side, a small RED lightning bolt pointing backward. White highlights and a soft yellow shadow near the sole.')),
  ('espalda', 'mochila', dict(objeto='compact BACKPACK', desc='A compact RED (#e0322e) backpack shaped like a HORIZONTAL OVAL. In the center, a WHITE circle framed by a YELLOW ring. Two small YELLOW lightning-bolt ornaments stick out from its sides, with soft rounded tips.')),
 ]),
 'pantera': ('Ciempi Pantera', [
  ('cabeza', 'completa', dict(desc='A glossy BLACK (#1d1f26) mask covering the whole round head, with two medium TRIANGULAR CAT EARS on top with rounded tips and DARK VIOLET (#5b2a9e) inner ears. Very thin ELECTRIC VIOLET (#9b5cff) lines run over the forehead and sides in a geometric pattern. Its own big ROUND bright friendly eyes with SILVER outlines and small violet reflections, a small black TRIANGULAR nose, a simple cute smiling mouth, and three small SILVER whisker marks on each cheek. Dark blue highlights so the black reads clearly.')),
  ('traje', 'traje', dict(paleta='glossy BLACK (#1d1f26) suit with ELECTRIC VIOLET (#9b5cff) geometric patterns, graphite grey edge stripes and bluish highlights on top',
     tiles='Top left: black with a central figure of elongated triangles connected by thin violet lines. Top middle: black with graphite grey edge stripes and bluish top highlights. Top right: black with violet triangle pattern. Bottom left: black with violet connecting lines and grey stripes. Bottom middle: chest panel, black with a central figure of elongated violet-outlined triangles joined by violet lines, symmetric. Bottom right: black with darker lower part and violet lines.')),
  ('botas', 'botas', dict(desc='BLACK (#1d1f26) boot with a rounded toe, a DARK VIOLET (#4a2380) sole and three small SILVER marks on the front. Glowing ELECTRIC VIOLET lines on the sides follow the curve of the shoe. Dark grey top edge and small white highlights.')),
  ('espalda', 'capa', dict(desc='A SHORT glossy BLACK (#1d1f26) cape with a SEMICIRCULAR shape and a slightly WAVY lower edge. Inner lining DARK VIOLET (#4a2380). A very thin ELECTRIC VIOLET line runs around the edge. Fastened at the neck by two small SILVER RHOMBUS-shaped clasps. Dark blue highlights so the black reads clearly.')),
 ]),
 'mistico': ('Ciempi Místico', [
  ('cabeza', 'gorro', dict(desc='A DARK BLUE (#1f3a8a) DIADEM / headband that wraps the upper part of the round head. In its center, an OVAL GOLDEN gem surrounded by small curved gold ornaments. On both sides, two GOLDEN pieces extend slightly toward the temples. Two small openings for the antennae. A slim elegant band, not a hat.')),
  ('traje', 'traje', dict(paleta='DEEP BLUE (#1f3a8a) robe fabric with a lighter blue central band, thin GOLD lines, original golden magic circles and a DARK RED (#8a1f2b) tunic border',
     tiles='Top left: deep blue with a wide lighter blue central band framed by thin gold lines. Top middle: deep blue with an ORIGINAL golden magic circle made of concentric rings, dots and small triangles. Top right: deep blue with gold lines and a dark red lower tunic border. Bottom left: lighter blue band with gold lines and dark red border. Bottom middle: chest panel, deep blue with one original golden magic circle (concentric rings, dots, small triangles), dark red border below. Bottom right: deep blue with soft reflections and gold lines.')),
  ('botas', 'botas', dict(desc='Elegant DARK BROWN (#5a3520) leather boot with a rounded toe and BLACK sole, a GOLDEN trim around the ankle cuff and small curved GOLDEN lines on the side. Illustrated leather with soft highlights.')),
  ('espalda', 'capa', dict(desc='An INTENSE RED (#d8343a) cape with a HIGH STAND-UP COLLAR that rises at the neck end: the collar has two large TRIANGULAR sections with rounded corners. Inner lining DARK BLUE (#1f3a8a), outer face bright red, all edges decorated with a continuous GOLDEN band. Fastened by ONE round GOLDEN clasp.')),
 ]),
 'marino': ('Ciempi Marino', [
  ('cabeza', 'gorro', dict(desc='A GOLDEN (#f2b632) CROWN that fits the round head, with FIVE wave-shaped points on top, the central one slightly taller. Its base band is EMERALD GREEN (#1f9a6b) set with small TURQUOISE gems. On both sides, two rounded golden SEASHELLS. Openings let the antennae through.')),
  ('traje', 'traje', dict(paleta='GOLDEN ORANGE (#f2a33a) suit covered with small overlapping semicircular SCALES with darker orange (#c9701f) edges, bright yellow highlights on top and an EMERALD GREEN (#1f9a6b) lower band with thin gold lines',
     tiles='Top left: golden orange overlapping scale rows with bright yellow top highlights. Top middle: scale rows curving over the volume. Top right: scales and an emerald green lower band with thin gold lines. Bottom left: scales over emerald band. Bottom middle: chest panel, neat rows of golden orange scales, emerald green band with gold lines below. Bottom right: scales with soft shading.')),
  ('botas', 'botas', dict(desc='EMERALD GREEN (#1f9a6b) boot with a rounded GOLDEN toe cap, small green scale patterns on the side, a DARK GREEN sole with three rounded divisions and a thick GOLDEN trim around the top of the cuff.')),
  ('espalda', 'mochila', dict(objeto='BACKPACK shaped like a SEASHELL', desc='A GOLDEN (#f2b632) scallop SEASHELL backpack with FIVE curved ridges radiating from the lower center, and a small shiny TURQUOISE PEARL in the center. On one side, a short decorative GOLDEN toy TRIDENT with three fully ROUNDED tips, held by a small green band.')),
 ]),
 'kpopvioleta': ('Ciempi Guerrera K-pop Violeta', [
  ('cabeza', 'gorro', dict(desc='A full WIG of intense VIOLET (#7a3dd8) hair covering the top and back of the round head, with lilac highlights and purple shadows. A long FRINGE falls diagonally over one side of the forehead WITHOUT covering the eyes. From the back hangs a thick DARK VIOLET BRAID made of five rounded sections ending in a SILVER ribbon. Two small SILVER STAR clips on one side. A wig only, no face.')),
  ('traje', 'traje', dict(paleta='INTENSE BLACK (#1d1f26) stage costume fabric with large diagonal VIOLET (#7a3dd8) stripes, SILVER stitch details, small four-pointed stars and glowing BLUE (#3cc8ff) geometric lines, and a darker violet band with small silver buckles',
     tiles='Top left: black with a wide violet diagonal stripe and silver stitches. Top middle: black satin with small four-pointed silver stars. Top right: black with violet stripe and a darker violet lower band with small silver buckles. Bottom left: black with glowing blue geometric lines. Bottom middle: chest panel, black with a violet diagonal stripe, ONE small four-pointed star and thin glowing blue lines, violet band with silver buckles below. Bottom right: black satin with violet stripe and shiny sectors.')),
  ('botas', 'botas', dict(desc='BLACK (#1d1f26) boot with a VIOLET (#7a3dd8) rounded toe cap and DARK GREY sole, a SILVER band at the top of the cuff and two small crossed VIOLET straps, small SILVER stars on the side. Strong white highlights on the toe.')),
  ('espalda', 'mochila', dict(objeto='compact BACKPACK', desc='A compact BLACK (#1d1f26) backpack shaped like a ROUNDED RHOMBUS, with a glowing VIOLET gem in the center framed in SILVER. On one side, a short fantasy TOY SWORD kept inside a black sheath: its short blade is translucent blue with a fully ROUNDED tip and its handle is violet (a soft toy, not a weapon).')),
 ]),
 'kpoprosa': ('Ciempi Guerrera K-pop Rosa', [
  ('cabeza', 'gorro', dict(desc='A full PINK (#ff5fa8) WIG with TWO big round hair BUNS on top, one on each side, each bun made of curved rolled strands and decorated with a small GOLDEN STAR. Light pink highlights and fuchsia shadows. A short FRINGE of three soft strands on the forehead. A wig only, eyes and mouth stay visible.')),
  ('traje', 'traje', dict(paleta='bright FUCHSIA (#e8378f) shiny stage fabric with BLACK diagonal stripes, light pink central zones, small GOLDEN stars, silver lines and a black lower band with golden buckle details',
     tiles='Top left: fuchsia with a black diagonal stripe. Top middle: light pink central zone framed by two curved black bands, small golden stars. Top right: fuchsia with silver lines and a black lower band with golden buckles. Bottom left: fuchsia with black stripe and gold stars. Bottom middle: chest panel, light pink center between two curved black bands, small golden stars and thin silver lines, black band with golden buckles below. Bottom right: shiny fuchsia with a black stripe.')),
  ('botas', 'botas', dict(desc='FUCHSIA (#e8378f) boot with a thick BLACK sole and rounded toe, a GOLDEN band at the top of the cuff, two small stars and one black diagonal line on the side. Large soft white highlights.')),
  ('espalda', 'mochila', dict(objeto='BACKPACK shaped like a rounded HEART', desc='An intense PINK (#ff5fa8) backpack shaped like a ROUNDED HEART with a BLACK rim and a GOLDEN STAR in the center. On its sides, two small folded decorative HAND FANS in light pink with golden ribs and soft ends.')),
 ]),
 'kpopazul': ('Ciempi Guerrera K-pop Azul', [
  ('cabeza', 'gorro', dict(desc='A full TURQUOISE (#25c4d6) WIG covering the top of the round head, with a HIGH PONYTAIL that starts at the back and falls in three big rounded curves. The fringe is swept to one side, leaving the forehead and both eyes visible. Light blue highlights and deep blue shadows. A SILVER ribbon with a small BLUE gem at the base of the ponytail and two small silver clips on the side. A wig only.')),
  ('traje', 'traje', dict(paleta='ELECTRIC BLUE (#2a6fdb) modern stage fabric with large WHITE panels, a TURQUOISE rhombus framed by silver lines, intense white highlights, a thin black line and a darker blue lower band, and small turquoise sparkles',
     tiles='Top left: electric blue with a large white panel. Top middle: blue with small turquoise sparkles and white highlights. Top right: blue with a thin black line and a darker blue band below. Bottom left: white panel with silver lines. Bottom middle: chest panel, ONE turquoise RHOMBUS framed by silver lines on electric blue, thin black line and darker blue band below. Bottom right: blue with turquoise sparkles.')),
  ('botas', 'botas', dict(desc='WHITE (#f4f8ff) boot with an ELECTRIC BLUE (#2a6fdb) rounded toe cap, a DARK BLUE sole with three divisions, a curved SILVER line and a small TURQUOISE gem on the side, and a bright blue trim at the top of the cuff.')),
  ('espalda', 'mochila', dict(objeto='BACKPACK', desc='An OVAL ELECTRIC BLUE (#2a6fdb) backpack with a TURQUOISE crystal in the center framed in WHITE. From both sides come two long decorative translucent glowing-blue RIBBONS shaped like musical waves, ending in rounded shapes.')),
 ]),
 'unicornio': ('Ciempi Unicornio', [
  ('cabeza', 'capucha', dict(desc='A soft PEARLY WHITE plush costume hood that turns the head into a cute fantasy creature. On top, a GOLDEN SPIRAL HORN with a rounded tip and yellow highlights. On both sides, two white ears with PINK insides. A small lock of hair in PINK, LILAC and LIGHT BLUE falls over the forehead (above the eyes, not covering them). Small decorative EYELASHES around the outer top of each eye aperture. Soft pink cheek blush on the hood near the lower edge. The lower edge leaves a WIDE opening so the smiling mouth is fully visible.')),
  ('traje', 'traje', dict(paleta='PEARLY WHITE plush fabric with pink and light blue reflections, small five-pointed stars in lilac, yellow and pink, pastel rainbow curved lines near the edges and a light LILAC lower band',
     tiles='Top left: pearly white with small lilac and pink stars. Top middle: white with pastel rainbow curved lines near the edge. Top right: white with yellow star and a light lilac lower band. Bottom left: pastel rainbow curves on white. Bottom middle: chest panel, pearly white with three small stars in lilac, yellow and pink, lilac band below. Bottom right: white plush with soft pink sheen.')),
  ('botas', 'botas', dict(desc='Small LILAC (#c9a3f0) bootie with a rounded WHITE toe, a PASTEL PINK sole with soft divisions, small GOLDEN hearts and WHITE stars on the side and a fluffy white fabric trim at the top of the cuff.')),
  ('espalda', 'espalda', dict(objeto='fluffy RAINBOW TAIL', desc='A long fluffy pastel TAIL that starts from a small round WHITE base (the attachment point is on the RIGHT end of the object) and flows to the LEFT, made of FIVE thick locks in pink, lilac, light blue, yellow and mint green, curving softly upward and ending in rounded tips. A small GOLDEN bow on the base.')),
 ]),
 'hada': ('Ciempi Hada Mágica', [
  ('cabeza', 'gorro', dict(desc='A round FLOWER CROWN made of small PINK, LILAC and WHITE flowers with five rounded petals and yellow centers, with small MINT GREEN leaves between them. A slightly bigger pink flower in the center of the front. A thin wreath that sits on the top of the head, not a hat.')),
  ('traje', 'traje', dict(paleta='PASTEL PINK (#ffc2dc) fabric with tiny flowers and MINT GREEN (#8fe0b8) leaves, small golden sparkles, white highlights and a LILAC lower band like a dress hem',
     tiles='Top left: pastel pink with three tiny flowers and mint leaves, evenly placed. Top middle: pink with golden sparkles. Top right: pink with tiny flowers and a lilac lower band. Bottom left: pink with mint leaves and sparkles. Bottom middle: chest panel, pastel pink with three tiny flowers in a neat arrangement, lilac hem band below. Bottom right: pink with small flowers and white highlights.')),
  ('botas', 'botas', dict(desc='Small VIOLET (#9b6bd8) bootie with a rounded PINK toe cap, a small PINK BOW at the top, a WHITE flower with a yellow center on the side and a DARK LILAC sole with soft highlights.')),
  ('espalda', 'espalda', dict(objeto='pair of FAIRY WINGS', desc='Two big translucent fairy WINGS seen from the side, rising upward: each wing has a wide rounded upper section and a smaller rounded lower section, filled with soft gradients of PINK, LILAC and LIGHT BLUE, with thin GOLDEN edge lines. A small PINK FLOWER at the base joins both wings (the attachment point is at the bottom center).')),
 ]),
 'sombrio': ('Ciempi Sombra', [
  ('cabeza', 'completa', dict(desc='A glossy BLACK (#14161c) mask covering the whole round head, smooth with big dark blue and white highlights. Its own big WHITE eyes slightly elongated toward the sides with thick black outlines, still expressive and FRIENDLY. A wide WHITE smile with small triangular teeth with ROUNDED tips and a dark pink inner mouth, playful like a cute cartoon. Small black waves on top like a flexible goo. Not scary, not aggressive.')),
  ('traje', 'traje', dict(paleta='glossy BLACK (#14161c) suit with large curved WHITE organic lines like white paint splashes spreading from the center to the sides, bluish edge reflections and graphite grey shadows',
     tiles='Top left: black with a big curved white organic line. Top middle: black with asymmetric white paint-splash curves. Top right: black with bluish reflections and graphite shadows. Bottom left: black with white curved lines spreading sideways. Bottom middle: chest panel, black with a large curved white organic shape spreading from the center to both sides. Bottom right: glossy black with a thin white curve.')),
  ('botas', 'botas', dict(desc='Fully glossy BLACK (#14161c) boot with a big rounded toe, a GRAPHITE GREY sole with three divisions, small wavy WHITE lines on the side and a darker black top edge. Strong white highlights, dark blue reflections.')),
  ('espalda', 'mochila', dict(objeto='BACKPACK shaped like a rounded DROP', desc='A BLACK (#14161c) backpack shaped like a rounded DROP with two big curved WHITE patches and dark blue highlights. From its sides come FOUR short flexible black ribbons with rounded tips, curving softly backward like stretchy fabric.')),
 ]),
 'hielo': ('Ciempi Princesa de Hielo', [
  ('cabeza', 'gorro', dict(desc='A SILVER crown that fits the top of the round head with FIVE transparent LIGHT BLUE ice CRYSTALS of different heights, elongated with soft tips, the central one tallest with a big white highlight. Under the crown, a small decorative hairstyle of very light platinum-blonde hair with soft strands sweeping to one side, and at the back a SHORT braid of silvery blonde hair ending in a blue ribbon. Eyes and mouth stay fully visible.')),
  ('traje', 'traje', dict(paleta='ICE BLUE (#a9dcf5) shiny fabric with WHITE six-armed snowflakes of soft geometric shape, small light-blue crystals, white highlights, small white stars and glowing dots, and a darker blue lower band with a silver edge',
     tiles='Top left: ice blue with two white six-armed snowflakes. Top middle: ice blue with small light-blue crystals and white highlights. Top right: ice blue with small stars and a darker blue band with silver edge. Bottom left: snowflakes and glowing dots. Bottom middle: chest panel, ice blue with ONE larger white six-armed snowflake and small stars, darker blue band with silver edge below. Bottom right: ice blue with small snowflakes.')),
  ('botas', 'botas', dict(desc='Small shiny LIGHT BLUE (#a9dcf5) bootie with a rounded toe, a soft WHITE fabric trim at the top, small SILVER snowflakes on the side and a DARK ICE BLUE sole with white highlights.')),
  ('espalda', 'capa', dict(desc='A LONG translucent BLUE cape with a gradient from light sky blue at the top to crystal blue at the bottom, small white snowflakes and silver sparkles on the fabric. The lower hem has FIVE soft waves. Fastened by two small SILVER CRYSTAL-shaped clasps.')),
 ]),
}

PLANTILLA = {'completa': COMPLETA, 'espalda': ESPALDA, 'capucha': CAPUCHA, 'antifaz': ANTIFAZ, 'gorro': GORRO, 'traje': TRAJE, 'botas': BOTAS, 'mochila': MOCHILA, 'capa': CAPA}
filas = []
for slug, (nombre, piezas) in H.items():
    for pieza, tipo, kw in piezas:
        pid = f'{slug}-{pieza}'
        txt = PLANTILLA[tipo].format(nombre=nombre, navy=NAVY, no=COMUN_NO, **kw)
        open(os.path.join(AQUI, 'ia/prompts', pid + '.txt'), 'w').write(txt + '\n')
        filas.append(f'{pid}\t{tipo}\tdocs/expansion-v10/heroes/ia/prompts/{pid}.txt\t{CIEMPI}\t{REF + FORMATO[tipo]}')
open(os.path.join(AQUI, 'ia/encargos.tsv'), 'w').write('\n'.join(filas) + '\n')
print(len(filas), 'prompts')
