"""Prompts de los rostros v4 (Dragón y Cuncuna). Escribe los .txt en las carpetas
docs/rediseno-ciempi/revisiones/T0x-*-v4-rostro/prompts/. Uso: python3 rostros-v4.py"""
import os
RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
REV = os.path.join(RAIZ, 'docs/rediseno-ciempi/revisiones')

LIENZO = ("OUTPUT FORMAT (strict, it is a game asset that will be cut out automatically): a square image on a plain pure WHITE background. "
          "Exactly ONE big round head seen from the front, centred, filling about 80 percent of the image height. The head is a perfect circle with a thick navy blue #243e5b outline "
          "and a COMPLETELY FLAT uniform orange #ff9e32 fill: no gradient, no shading, no highlight, no texture on the orange (it is a stand-in that will be replaced). "
          "Draw ONLY the face on it. Do NOT draw horns, ears, antennae, hair tufts, hats, neck or body. No text, no labels, no shadow under the head.")
ESTILO = ("Illustration language identical to the references: flat 2D children's cartoon, thick navy blue #243e5b outlines of consistent weight, rounded friendly shapes, "
          "soft cartoon volume on the facial features with highlight from the upper left. Not realistic, no texture noise, no 3D render.")
POSICION = ("Face placement (important, it must fit the game rig): the face is turned slightly toward the viewer's RIGHT like the reference faces. "
            "The viewer-left eye sits a little left of the head centre at mid height and is slightly larger; the viewer-right eye sits about halfway between the centre and the right edge, "
            "a little higher and slightly smaller. Mouth below the eyes, slightly right of centre. Keep every facial feature well inside the circle (at least 8 percent margin from the outline) "
            "unless stated otherwise.")
ORIGINAL = "Original design: it must not resemble any existing franchise or trademarked character."

DR = ("Reference image 1 is the current head of 'Ciempi Dragon' (a baby-dragon transformation of Ciempi, a centipede mascot of a children's reading app): "
      "its horns and fin ears are approved and stay, but its FACE is NOT approved because it is still Ciempi's face with a patch. Reference image 2 is the approved dragon body (colour harmony: "
      "emerald-teal green, cream belly, orange spikes). Reference image 3 shows Ciempi's own expression faces: copy their drawing style and line weight, but the new face must look clearly "
      "DIFFERENT from Ciempi's eyes and mouth. Design a NEW, adorable BABY DRAGON FACE for this head. It must read as a cute baby dragon at a small size, never scary. ")
CU = ("Reference image 1 is the current head of 'Ciempi Cuncuna' (a transformation of Ciempi, a centipede mascot of a children's reading app, into a cuncuna: the Chilean name for a "
      "hairy tussock caterpillar with brush-like tufts): its yellow-coral tuft and mint antennae are approved and stay, but its FACE is NOT approved because it is still Ciempi's face. "
      "Reference image 2 is the approved cuncuna body (lilac and mint balls with yellow and coral tufts). Reference image 3 shows Ciempi's own expression faces: copy their drawing style and line weight, "
      "but the new face must look clearly DIFFERENT from Ciempi's eyes and mouth. Design a NEW, very tender and sweet CUNCUNA (fuzzy caterpillar) FACE for this head. ")

P = {
 'T01-dragon-v4-rostro': {
  'propuesta-d4a-hocico-corto': DR + "Design A: a short rounded cream-yellow MUZZLE that bulges forward from the lower right part of the face and may stick out slightly beyond the right edge of the head circle, "
    "with two clear oval NOSTRILS on its top; the mouth is a wide happy open smile along the muzzle with a pink tongue and TWO TINY rounded white FANGS pointing down from the upper lip. "
    "Eyes: big glossy baby-reptile eyes with a warm golden-amber iris and a soft vertical OVAL pupil (rounded, not a thin slit), two white sparkles; small scaly brow ridges in mint green above each eye instead of plain eyebrows. "
    "Two small mint scale freckles on the cheeks instead of blush. " + POSICION + " " + ESTILO + " " + ORIGINAL + " " + LIENZO,
  'propuesta-d4b-placa-crema': DR + "Design B: a large soft cream SNOUT PLATE covering the lower half of the face, shaped like a rounded heart pointing up between the eyes, outlined in navy; "
    "on it two curled comma-shaped NOSTRILS near the top and a big friendly grin with ONE small white fang on each side pointing up from the lower lip. "
    "Eyes: large round green-and-yellow reptile eyes with a rounded diamond-shaped pupil and big sparkles, gentle heavy upper lids. Brows: three tiny raised scales above each eye. "
    "A few small darker-orange scale marks on the forehead. " + POSICION + " " + ESTILO + " " + ORIGINAL + " " + LIENZO,
  'propuesta-d4c-mejillas-escamas': DR + "Design C: NO big muzzle plate; instead a cute small rounded NOSE BUMP between the eyes and the mouth with two little round nostrils, "
    "and chubby CHEEKS covered by small overlapping mint-green SCALES like a baby lizard; a wide smile that curls up at the corners showing two tiny white fangs at the top. "
    "Eyes: big almond-shaped eyes with turquoise iris and a vertical oval pupil, long single eyelash flick at the outer corner, bold sparkles. Thick rounded mint brow scales. "
    + POSICION + " " + ESTILO + " " + ORIGINAL + " " + LIENZO,
  'propuesta-d4d-perfil-hocico': DR + "Design D: a three-quarter baby dragon face with a pronounced rounded SNOUT pointing to the viewer's right that clearly protrudes beyond the right edge of the head circle "
    "(like a puppy-dragon muzzle), cream colour with a navy outline, two oval NOSTRILS on its tip and a gentle smile line along it ending in a small open mouth with a pink tongue and two tiny fangs. "
    "Eyes placed above the snout: big glossy eyes with a golden iris and a rounded vertical pupil; small mint scale brows; light cream scale freckles under the eyes. "
    "The protruding snout is the only part allowed outside the circle. " + POSICION + " " + ESTILO + " " + ORIGINAL + " " + LIENZO,
 },
 'T02-cuncuna-v4-rostro': {
  'propuesta-c4a-mejillas-pompon': CU + "Design A: two FLUFFY CHEEK POMPOMS: soft round coral-pink tufts of short fur on the cheeks, outlined in navy; very big glossy round eyes with a deep plum-violet iris, "
    "three white sparkles each and two short upper eyelashes; tiny curved fuzzy yellow eyebrows; a small sweet open smile shaped like a soft rounded triangle with a pink tongue. "
    + POSICION + " " + ESTILO + " " + ORIGINAL + " " + LIENZO,
  'propuesta-c4b-cejas-plumosas': CU + "Design B: thick FEATHERY EYEBROWS made of small yellow bristle tufts (like the cuncuna's brush tufts, but tiny) that will carry the expressions; "
    "big oval eyes with mint-green iris and a big dark pupil, sparkles; rosy oval cheeks with three tiny coral freckle dots each; a small soft smile with a tiny pink tongue tip. "
    + POSICION + " " + ESTILO + " " + ORIGINAL + " " + LIENZO,
  'propuesta-c4c-ocelos': CU + "Design C: inspired by real caterpillars: two pairs of tiny decorative 'eye-spot' markings (small lilac dots with a mint centre) at the outer sides of the face like caterpillar ocelli, "
    "huge soft dark-brown glossy eyes with many sparkles and a gentle shape, a small happy mouth with two tiny rounded mandible-like lip bumps at the corners (cute, not insect-scary), "
    "and soft pink heart-shaped blush cheeks. " + POSICION + " " + ESTILO + " " + ORIGINAL + " " + LIENZO,
  'propuesta-c4d-hocico-peluche': CU + "Design D: a plush-toy look: a soft pale peach rounded MUZZLE PATCH around the mouth with a fuzzy edge, a tiny sweet mouth in it with a small pink tongue; "
    "round shiny eyes with lilac iris and white sparkles, short soft fluffy fringe of mint fuzz along the upper eyelids; small round coral cheeks. " + POSICION + " " + ESTILO + " " + ORIGINAL + " " + LIENZO,
 },
}
for carpeta, prompts in P.items():
    d = os.path.join(REV, carpeta, 'prompts'); os.makedirs(d, exist_ok=True)
    for k, v in prompts.items():
        open(os.path.join(d, k + '.txt'), 'w').write(v + '\n')
print(sum(len(p) for p in P.values()), 'prompts')

# ── Ronda 2: hojas de expresiones B03 sobre el diseño elegido (2×2 por imagen) ──
EXPR = {
 'alegre': "HAPPY: both eyes open, a big open happy smile",
 'carcajada': "BIG LAUGH: both eyes squeezed shut as upward happy arcs, mouth very wide open laughing with the tongue showing",
 'curioso': "CURIOUS: both eyes open looking up toward the viewer's right, one brow raised higher than the other, a small open smile",
 'pensativo': "THOUGHTFUL: both eyes open looking up and to the side, brows slightly uneven, mouth a small wavy pursed line pushed to one side",
 'sorprendido': "SURPRISED: both eyes wide open, brows raised high, mouth a small round open 'o' showing a little tongue",
 'dormilon': "SLEEPY: heavy upper eyelids covering the top half of both eyes (half closed), brows relaxed and flat, small calm closed mouth",
 'besito': "KISS: both eyes closed as gentle relaxed arcs, lips puckered forward in a small kiss",
 'guino': "WINK: the viewer-LEFT eye open, the viewer-RIGHT eye closed in a wink arc, a cheeky open smile",
 'orgulloso': "PROUD: half-lidded confident eyes, level brows, a closed satisfied smile",
 'confundido': "CONFUSED: eyes open, one brow lowered and the other raised, a small wobbly frown pushed to one side",
 'triste': "SAD: brows tilted up in the middle, eyes open looking a bit down, a small downturned mouth",
 'enojadito': "GRUMPY (cute, never scary): brows angled down toward the centre, eyes open, a small pouty frown",
 'asustado': "SCARED: eyes wide open with small pupils, worried raised brows, mouth open in a wobbly worried shape",
 'concentrado': "FOCUSED: brows low and determined, eyes slightly narrowed, mouth a short flat line",
}
HOJAS = [['alegre', 'carcajada', 'curioso', 'pensativo'], ['sorprendido', 'dormilon', 'besito', 'guino'],
         ['orgulloso', 'confundido', 'triste', 'enojadito'], ['asustado', 'concentrado', 'alegre', 'sorprendido']]
FORMATO2 = ("OUTPUT FORMAT (strict, it is a game asset sheet that will be cut out automatically): a square image on a plain pure WHITE background, divided into a 2 x 2 grid of four equal cells "
            "(no grid lines, no text, no labels). Each cell contains exactly ONE complete round head of the same size, centred in its cell with a white margin around it, "
            "with the same thick navy blue #243e5b circle outline and a COMPLETELY FLAT uniform orange #ff9e32 fill (no gradient, no shading, no highlight on the orange). "
            "Draw only the face; no horns, ears, antennae, tufts, hats or body. The four heads are the SAME character, drawn identically: same face layout, same position and size of eyes, "
            "same colours, same line weight; ONLY the eyelids, brows, pupils direction and mouth change to show the expression.")
DISENO = {
 'T01-dragon-v4-rostro': ("Reference image 1 is the APPROVED new baby-dragon face design for 'Ciempi Dragon' (keep it exactly: the cream rounded SNOUT that protrudes beyond the right edge of the head circle with two "
     "oval nostrils at its tip, the mouth drawn along the snout with two tiny white fangs when it opens, golden-amber eyes with a rounded vertical pupil and white sparkles, short mint scale brows, "
     "and the small cream scale freckles on the left cheek and under the right eye). Reference image 2 shows the expression set of the original character: match each expression's "
     "MEANING, but keep the dragon design of reference 1. The snout, nostrils and freckles never change between expressions; even with a closed mouth one tiny fang may peek out. ", 'propuesta-d4d-perfil-hocico'),
 'T02-cuncuna-v4-rostro': ("Reference image 1 is the APPROVED new face design for 'Ciempi Cuncuna' (a sweet fuzzy caterpillar; keep it exactly: very big glossy round eyes with a plum-violet iris and "
     "white sparkles, two short upper eyelashes on the outer side of each eye, small fuzzy yellow eyebrows, two fluffy coral-pink cheek POMPOMS, a small sweet mouth with a pink tongue). "
     "Reference image 2 shows the expression set of the original character: match each expression's MEANING, but keep the cuncuna design of reference 1. The cheek pompoms never change "
     "between expressions; the yellow fuzzy brows carry the emotion. ", 'propuesta-c4a-mejillas-pompon'),
}
for carpeta, (texto, _) in DISENO.items():
    d = os.path.join(REV, carpeta, 'prompts')
    for i, hoja in enumerate(HOJAS, 1):
        celdas = ' '.join(f"Cell {pos}: {EXPR[e]}." for pos, e in zip(['top-left', 'top-right', 'bottom-left', 'bottom-right'], hoja))
        open(os.path.join(d, f'hoja-{i}.txt'), 'w').write(texto + "Draw these four expressions. " + celdas + " " + POSICION + " " + ESTILO + " " + ORIGINAL + " " + FORMATO2 + '\n')

# ── Iteración 2 (v4b): correcciones de la revisión independiente ─────────────
IT2 = {
 'T01-dragon-v4-rostro': {
  'base': ("Reference image 1 is the CURRENT baby-dragon face design for 'Ciempi Dragon' (keep its identity: golden-amber eyes with a rounded vertical pupil and white sparkles, short mint scale brows, "
           "small cream freckles, cream snout with two nostrils and tiny white fangs). Reference image 2 is the dragon head with its approved horns and fin ears. Reference image 3 shows the expression style of the original character. "
           "Problem to fix: in reference 1 the snout is drawn in PROFILE and touches/crosses the right edge of the head while the head and eyes are frontal: it looks like three mixed views. "),
  'propuestas': {
   'propuesta-d5a-hocico-3cuartos': "Redraw the face with the cream SNOUT turned about 30 degrees toward the viewer: a rounded three-quarter, almost frontal muzzle centred slightly right of the head centre, in the lower half of the face, "
     "FULLY INSIDE the head circle with a clear orange margin all around it (it must not touch the outline). Both oval nostrils on the front top of the snout, well inside. The happy open mouth spans the lower part of the snout with two tiny fangs. "
     "Eyes, brows and freckles as in reference 1, in the same places.",
   'propuesta-d5b-hocico-frontal': "Redraw the face with a softly rounded, nearly FRONTAL cream snout (a wide rounded bean shape) in the lower centre-right of the face, FULLY INSIDE the head circle with a clear orange margin all around; "
     "two oval nostrils on its upper part, a wide happy open smile below them with two tiny fangs and a pink tongue. Eyes, brows and freckles as in reference 1, in the same places.",
  },
 },
 'T02-cuncuna-v4-rostro': {
  'base': ("Reference image 1 is the CURRENT face design for 'Ciempi Cuncuna' (a sweet fuzzy caterpillar): keep its identity (plum eyes, fuzzy yellow eyebrows, fluffy coral cheek pompoms, small sweet mouth). "
           "Reference image 2 is the cuncuna head with its approved tuft and antennae. Reference image 3 shows the original character's expression style (simpler eyes, one highlight, navy line work). "
           "Problems to fix: the yellow eyebrows are almost invisible on orange; the eyes are too big and too sparkly (generic anime look); the cheek pompoms are too big and hide the expression at small size. "),
  'propuestas': {
   'propuesta-c5a-sobria': "Redraw the face: eyes about 15 percent SMALLER than in reference 1, with a softer deep plum-brown iris and ONE single white highlight per eye (no extra sparkles), only one or two very short eyelashes at the outer corner; "
     "the fuzzy yellow eyebrows now have a clear thick navy #243e5b OUTLINE so they read on orange; the coral cheek pompoms about 20 percent SMALLER and slightly softer, less saturated pink-coral, placed low on the cheeks away from the mouth; small sweet open smile with a pink tongue.",
   'propuesta-c5b-cejas-marron': "Redraw the face: eyes about 15 percent SMALLER than in reference 1, simple round eyes with a deep plum iris and ONE single white highlight, no eyelashes; fuzzy eyebrows in a warm LIGHT BROWN / caramel colour with a thin navy outline; "
     "small soft muted coral cheek pompoms (about 20 percent smaller than in reference 1); small sweet open smile with a pink tongue.",
  },
 },
}
for carpeta, d in IT2.items():
    out = os.path.join(REV, carpeta, 'prompts', 'it2'); os.makedirs(out, exist_ok=True)
    for k, v in d['propuestas'].items():
        open(os.path.join(out, k + '.txt'), 'w').write(d['base'] + v + " " + POSICION + " " + ESTILO + " " + ORIGINAL + " " + LIENZO + '\n')

# Hojas de la iteración 2 sobre las propuestas elegidas (d5a, c5a).
EXPR2 = dict(EXPR)
EXPR2['dormilon'] = "SLEEPY: eyelids almost completely CLOSED (only a thin sliver of each eye visible under heavy lids), brows LOWERED, relaxed and flat, tiny calm closed mouth"
EXPR2['orgulloso'] = "PROUD: confident half-lidded eyes with brows RAISED high, a wide closed smug smile (clearly different from sleepy)"
EXPR2['asustado'] = "SCARED: eyes wide open with small pupils, worried raised brows, a small rounded OVAL open mouth (simple and cute, not distorted, no zigzag lips)"
DISENO2 = {
 'T01-dragon-v4-rostro': ("Reference image 1 is the APPROVED new baby-dragon face for 'Ciempi Dragon' (keep it exactly: the cream three-quarter SNOUT fully inside the head circle with an orange margin all around, "
     "two oval nostrils on its top, the mouth on the snout with two tiny white fangs when open, golden-amber eyes with a rounded vertical pupil and white sparkles, short mint scale brows, small cream freckles). "
     "Reference image 2 shows the expression set of the original character: match each expression's MEANING, but keep the dragon design of reference 1. The snout, nostrils and freckles never change and never touch the head outline. "),
 'T02-cuncuna-v4-rostro': ("Reference image 1 is the APPROVED new face for 'Ciempi Cuncuna' (keep it exactly: medium-size round eyes with a deep plum-brown iris and ONE single white highlight, one or two tiny eyelashes, "
     "fuzzy yellow eyebrows with a clear thick navy outline, small soft coral cheek pompoms placed low on the cheeks, small sweet mouth with a pink tongue). Do NOT make the eyes bigger or add extra sparkles. "
     "Reference image 2 shows the expression set of the original character: match each expression's MEANING, but keep the cuncuna design of reference 1. The cheek pompoms never change; the outlined yellow brows carry the emotion. "),
}
for carpeta, texto in DISENO2.items():
    d = os.path.join(REV, carpeta, 'prompts', 'it2')
    for i, hoja in enumerate(HOJAS, 1):
        celdas = ' '.join(f"Cell {pos}: {EXPR2[e]}." for pos, e in zip(['top-left', 'top-right', 'bottom-left', 'bottom-right'], hoja))
        open(os.path.join(d, f'hoja-{i}.txt'), 'w').write(texto + "Draw these four expressions. " + celdas + " " + POSICION + " " + ESTILO + " " + ORIGINAL + " " + FORMATO2 + '\n')
