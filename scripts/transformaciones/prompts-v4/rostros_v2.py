"""Prompts de la iteración 2 (rostros propios) de T03 Serpiente y T04 Camaleón, con el mismo
método que los rostros v4 de Dragón/Cuncuna (rama expansion-v4-rostros): propuestas sobre un disco
naranja plano (clave que se quita) y luego hojas 2×2 con las 14 expresiones B03.
Escribe docs/rediseno-ciempi/revisiones/T0x-*-v2/prompts/*.txt. Uso: python3 rostros_v2.py [hojas]"""
import os, sys
RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
REV = os.path.join(RAIZ, 'docs/rediseno-ciempi/revisiones')

LIENZO = ("OUTPUT FORMAT (strict, it is a game asset that will be cut out automatically): a square image on a plain pure WHITE background. "
          "Exactly ONE big round head seen from the front, centred, filling about 70 percent of the image height (leave white margin all around). The head is a perfect circle with a thick navy blue #243e5b outline "
          "and a COMPLETELY FLAT uniform orange #ff9e32 fill: no gradient, no shading, no highlight, no texture on the orange (it is a stand-in that will be replaced by the creature's own skin). "
          "Draw ONLY the face on it. Do NOT draw horns, crest, antennae, hair, hats, neck or body. No text, no labels, no shadow under the head.")
ESTILO = ("Illustration language identical to the references: flat 2D children's cartoon, thick navy blue #243e5b outlines of consistent weight, rounded friendly shapes, "
          "soft cartoon volume on the facial features with highlight from the upper left. Not realistic, no texture noise, no 3D render.")
ORIGINAL = ("Original design: it must not resemble any existing franchise, meme or trademarked character (in particular it must NOT look like a red echidna "
            "with a big cream muzzle).")
POS_S = ("Face placement (it must fit the game rig): the face is turned slightly toward the viewer's RIGHT. The two eyes sit HIGH on the head (their centres in the upper half) and FAR APART, "
         "the viewer-left eye a little lower and slightly larger, the viewer-right eye higher and slightly smaller. Mouth across the lower part of the face. "
         "Keep every feature inside the circle with some margin.")
POS_C = ("Face placement (it must fit the game rig): the face is turned slightly toward the viewer's RIGHT. Viewer-left turret eye a little left of the head centre at mid height and larger; "
         "viewer-right turret eye about halfway between the centre and the right edge, a little higher and smaller. Mouth below them, slightly right of centre.")

SE = ("Reference image 1 is the approved concept of 'Ciempi Serpiente' (a cute legless snake made of coral pink and sunny yellow segments; its head skin in the game is coral pink #ff6f6f). "
      "Reference image 2 shows the expression faces of Ciempi, the original mascot: copy their drawing style and line weight, but the new face must look clearly DIFFERENT from Ciempi's eyes, "
      "brows, round blush and mouth. Design a NEW adorable SNAKE FACE for this head, gentle and friendly, never scary, NO teeth and NO fangs. Draw the features so they look right on a coral pink head. ")
CA = ("Reference image 1 is the approved concept of 'Ciempi Camaleon' (a cute rainbow chameleon caterpillar, lime green head with a pink and yellow casque, chameleon TURRET EYES). "
      "Reference image 2 shows the expression faces of Ciempi, the original mascot: copy their drawing style and line weight, but the new face must look clearly DIFFERENT from Ciempi's eyes, "
      "round blush and mouth. Design a NEW adorable CHAMELEON FACE for this head, never scary. Draw the features so they look right on a lime green head. "
      "TURRET EYES (most important): each eye is a big rounded CONE of lime green scaly skin with a few concentric ridge rings, seen in three-quarter view so it clearly BULGES OUT as a volume with light and shadow, "
      "and the eyeball with the pupil sits at the TIP of the cone (a small white eye with a navy pupil and a sparkle). The turrets must protrude BEYOND the head outline: the viewer-left turret bulges toward the upper left "
      "past the circle edge, the viewer-right turret sticks out past the right edge of the circle. They must NOT look like flat painted rings or hypnotic spirals. ")
P = {
 'T03-serpiente-v2': {
  'propuesta-s2a-diamante': SE + "Design A: tall OVAL eyes (taller than wide) with a warm golden iris, a rounded vertical pupil and two sparkles, set high and far apart, with a soft navy upper lid line; "
    "tiny arched scale brows; a single small rounded yellow DIAMOND mark on the forehead between the eyes (like the body stripes); a very WIDE gentle snake smile: one long curved line from cheek to cheek "
    "across the lower face, slightly open in the middle showing a dark mouth and a SHORT pink forked tongue tip coming out of the inside of the mouth; two tiny nostril dots just above the middle of the smile; "
    "small yellow scale freckles on the cheeks instead of round blush. " + POS_S + " " + ESTILO + " " + ORIGINAL + " " + LIENZO,
  'propuesta-s2b-barbilla': SE + "Design B: a pale yellow CHIN BAND only along the bottom edge of the head (like the snake's belly scutes continuing under the jaw, with two faint curved scute lines), "
    "and a WIDE flat smiling mouth that runs along the top of that band from side to side; big OVAL eyes with a turquoise iris and a rounded vertical pupil, set high and wide apart, with heavy friendly upper lids; "
    "no nose bump, just two small nostril slits above the mouth; three tiny coral scale marks on each cheek. " + POS_S + " " + ESTILO + " " + ORIGINAL + " " + LIENZO,
  'propuesta-s2c-gota': SE + "Design C: teardrop-shaped eyes tilted outward (narrow end toward the centre), mint green iris with a rounded vertical pupil and big sparkles, set high on the head; "
    "two thin yellow stripes curving over the top of the head like a little crown pattern; a broad friendly snake grin shaped like a wide soft 'V' with rounded corners and NO teeth; "
    "two heart-shaped tiny nostrils; small yellow diamond freckles under the eyes. " + POS_S + " " + ESTILO + " " + ORIGINAL + " " + LIENZO,
 },
 'T04-camaleon-v2': {
  'propuesta-k2a-anillos': CA + "Design A: turret cones in lime with three raised PINK ridge rings (as in the concept), eyeball at the tip with a navy pupil; "
    "a WIDE reptile mouth: a long thin smiling line across the face that curls up at both ends, slightly open in the middle with a small pink tongue tip; "
    "CHEEKS made of small rounded overlapping SCALES in a slightly darker lime with a few pink scales (no round blush); two tiny nostril dots. " + POS_C + " " + ESTILO + " " + ORIGINAL + " " + LIENZO,
  'propuesta-k2b-crestas': CA + "Design B: turret cones in lime with soft yellow ridges and darker green shading on the underside, a thin pink eyelid rim around the eyeball at the tip; "
    "a wide reptile grin with a gently zig-zag-free curved lip line that reaches far to the sides; little scale patches on the cheeks in pink and yellow; small arched scale brows on top of each turret. "
    + POS_C + " " + ESTILO + " " + ORIGINAL + " " + LIENZO,
  'propuesta-k2c-mirada': CA + "Design C: big chunky turret cones with strong 3D volume (lit from the upper left, shaded lower right), lime with two pink and one yellow ring, each eyeball at the tip; "
    "a very wide closed smile line (reptile mouth) with a small curl at each corner; a band of tiny rounded scales across both cheeks and the bridge between the turrets. " + POS_C + " " + ESTILO + " " + ORIGINAL + " " + LIENZO,
 },
}
EXTRA = {
 'T03-serpiente-v2': {
  'pieza-serpiente-cabeza-lisa': ("Reference image 1 is the approved concept 'Ciempi Serpiente' (cute coral pink and yellow snake). Reference image 2 is the original Ciempi head without cap. "
     "Draw ONLY the plain HEAD SKIN as one piece: a perfectly ROUND glossy warm coral pink disc with a thick navy outline, same proportions as reference 2, soft highlight on the upper left and gentle shading on the lower right. "
     "Absolutely NO face: no eyes, no brows, no muzzle patch, no mouth, no nostrils, no cheeks. " + ESTILO + " No text, no background: genuine transparent background with wide transparent margins."),
 },
 'T04-camaleon-v2': {
  'pieza-camaleon-pata': ("Reference image 1 is the approved concept 'Ciempi Camaleon' (cute rainbow chameleon caterpillar). Reference image 2 is the original approved Ciempi character: look at how THICK and chunky its legs are. "
     "Draw TWO separate pieces side by side with a wide transparent gap: piece 1 is ONE short, THICK, chunky lime green LEG seen from the side, a rounded column only about 1.3 times taller than wide (as chunky as Ciempi's legs), "
     "with a soft highlight on the left and two or three small scale marks; piece 2 is ONE prehensile chameleon FOOT seen from the side with the toes pointing to the RIGHT: "
     "a plump lime foot ending in TWO clear rounded toe bundles in cream, one pointing forward and one pointing backward like a gentle pincer grip, flat underside, its top opening as wide as the leg. "
     + ESTILO + " No text, no background: genuine transparent background with wide transparent margins."),
 },
}
EXPR = {
 'alegre': "HAPPY: both eyes open, the wide snake smile slightly open in the middle, with a SHORT small pink forked tongue tip that stays INSIDE the dark mouth opening and peeks out only a little past the lip (unlike reference 1, it must NOT hang down toward the chin)",
 'alegre-sinlengua': "HAPPY WITHOUT TONGUE: identical to HAPPY but the mouth shows no tongue",
 'carcajada': "BIG LAUGH: both eyes squeezed shut as upward happy arcs, the wide mouth very open laughing, with a SHORT small pink forked tongue resting INSIDE the open mouth (not hanging out)",
 'curioso': "CURIOUS: both eyes open looking up toward the viewer's right, one brow raised higher than the other, a small open smile",
 'pensativo': "THOUGHTFUL: both eyes open looking up and to the side, mouth a small wavy line pushed to one side",
 'sorprendido': "SURPRISED: both eyes wide open, brows raised high, mouth a small round open 'o'",
 'dormilon': "SLEEPY: heavy upper eyelids covering the top half of both eyes (half closed), small calm closed mouth",
 'besito': "KISS: both eyes closed as gentle relaxed arcs, lips puckered forward in a small kiss",
 'guino': "WINK: the viewer-LEFT eye open, the viewer-RIGHT eye closed in a wink arc, a cheeky wide closed smile with NO tongue",
 'orgulloso': "PROUD: half-lidded confident eyes, a closed satisfied wide smile",
 'confundido': "CONFUSED: eyes open, one brow lowered and the other raised, a small wobbly frown pushed to one side",
 'triste': "SAD: eyes open looking a bit down with worried brows, a small downturned mouth",
 'enojadito': "GRUMPY (cute, never scary): brows angled down toward the centre, eyes open, a small pouty frown",
 'asustado': "SCARED: eyes wide open with small pupils, worried raised brows, mouth open in a wobbly worried shape",
 'concentrado': "FOCUSED: eyes slightly narrowed and determined, mouth a short flat line",
 'carcajada-sinlengua': "BIG LAUGH WITHOUT TONGUE: identical to BIG LAUGH but the open mouth shows no tongue",
}
EXPR_C = dict(EXPR)
EXPR_C['alegre'] = "HAPPY: both turret eyes open, a wide open reptile smile with a small pink tongue"
EXPR_C['carcajada'] = "BIG LAUGH: both eyeballs at the turret tips squeezed shut (the turret cones stay exactly the same, only a closed happy eyelid arc at each tip), the wide mouth very open laughing"
EXPR_C['besito'] = "KISS: both eyeballs closed as relaxed eyelid arcs at the turret tips (cones unchanged), lips puckered in a small kiss"
EXPR_C['guino'] = "WINK: the viewer-LEFT turret eye open, the viewer-RIGHT turret eye closed with an eyelid arc at its tip (cone unchanged), a cheeky wide smile"
EXPR_C['dormilon'] = "SLEEPY: heavy eyelids half covering both eyeballs at the turret tips (cones unchanged), small calm closed mouth"
HOJAS_S = [['alegre', 'carcajada', 'curioso', 'pensativo'], ['sorprendido', 'dormilon', 'besito', 'guino'],
           ['orgulloso', 'confundido', 'triste', 'enojadito'], ['asustado', 'concentrado', 'alegre-sinlengua', 'carcajada-sinlengua']]
HOJAS_C = [['alegre', 'carcajada', 'curioso', 'pensativo'], ['sorprendido', 'dormilon', 'besito', 'guino'],
           ['orgulloso', 'confundido', 'triste', 'enojadito'], ['asustado', 'concentrado', 'alegre', 'sorprendido']]
# Rasgos fijos de cada diseño elegido, repetidos en cada hoja (2.ª pasada de la Serpiente: la 1.ª derivó a ojos redondos).
RASGOS = {
 'T03-serpiente-v2': ("The creature is 'Ciempi Serpiente', a cute snake whose head skin in the game is coral pink. FIXED DETAILS in every expression: TALL OVAL eyes, clearly about 1.4 times taller than wide, "
     "with a warm golden iris and a soft VERTICAL OVAL pupil (snake-like but cute, never a thin slit), placed HIGH in the upper half of the head and FAR APART (more than Ciempi's), the viewer-left eye slightly bigger; "
     "thin arched brows; one small yellow rounded diamond on the forehead; small yellow scale freckles on both cheeks; two tiny nostril dots; a WIDE snake mouth that spans most of the lower face from cheek to cheek, "
     "with NO teeth and NO fangs. The tongue only appears where an expression asks for it, and then it is SHORT and stays inside the mouth opening. "),
 'T04-camaleon-v2': ("The creature is 'Ciempi Camaleon'. FIXED DETAILS in every expression: big conical TURRET eyes of lime scaly skin with raised pink ridge rings, clearly protruding beyond the head outline "
     "(the left one toward the upper left, the right one past the right edge), eyeball with the pupil at the TIP of each cone; the cones never change, only the eyeball and its eyelid at the tip change; "
     "cheeks of small rounded lime and pink scales (no round blush); two tiny nostril dots; a WIDE reptile mouth. "),
}
FORMATO2 = ("OUTPUT FORMAT (strict, it is a game asset sheet that will be cut out automatically): a square image on a plain pure WHITE background, divided into a 2 x 2 grid of four equal cells "
            "(no grid lines, no text, no labels). Each cell contains exactly ONE complete round head of the same size, centred in its cell with a generous white margin around it (anything sticking out of the circle must stay inside its own cell), "
            "with the same thick navy blue #243e5b circle outline and a COMPLETELY FLAT uniform orange #ff9e32 fill (no gradient, no shading, no highlight on the orange). "
            "Draw only the face; no crest, horns, antennae, hats or body. The four heads are the SAME character, drawn identically: same face layout, same position and size of the eyes, "
            "same colours, same line weight; ONLY the eyelids, brows, pupil direction and mouth change to show the expression.")

if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'hojas':
        disenos = {'T03-serpiente-v2': (sys.argv[2], SE, POS_S, HOJAS_S, EXPR), 'T04-camaleon-v2': (sys.argv[3], CA, POS_C, HOJAS_C, EXPR_C)}
        solo = sys.argv[4] if len(sys.argv) > 4 else None
        for carpeta, (elegida, base, pos, hojas, expr) in disenos.items():
            if solo and solo not in carpeta:
                continue
            d = os.path.join(REV, carpeta, 'prompts')
            texto = (f"Reference image 1 is the APPROVED new face design '{elegida}' for this creature: keep it exactly (same eye shape, colours, marks, mouth style, cheeks and every fixed detail). "
                     "Reference image 2 shows the expression set of the original character: match each expression's MEANING, but keep the design of reference 1 and do NOT copy the eyes or mouths of reference 2. "
                     + RASGOS[carpeta])
            for i, hoja in enumerate(hojas, 1):
                celdas = ' '.join(f"Cell {p}: {expr[e]}." for p, e in zip(['top-left', 'top-right', 'bottom-left', 'bottom-right'], hoja))
                open(os.path.join(d, f'hoja-{i}.txt'), 'w').write(texto + "Draw these four expressions. " + celdas + " " + pos + " " + ESTILO + " " + ORIGINAL + " " + FORMATO2 + '\n')
        print('hojas escritas')
    else:
        for grupo in (P, EXTRA):
            for carpeta, prompts in grupo.items():
                d = os.path.join(REV, carpeta, 'prompts'); os.makedirs(d, exist_ok=True)
                for k, v in prompts.items():
                    open(os.path.join(d, k + '.txt'), 'w').write(v + '\n')
        print('propuestas y piezas escritas')
