# Prompts de piezas modulares V4 (edición sobre el concepto elegido). Escribe ./textos/pieza-*.txt.
import os
d = os.path.dirname(os.path.abspath(__file__))
os.makedirs(os.path.join(d, 'textos'), exist_ok=True)
ESTILO = ("Keep exactly the illustration language of the references: flat 2D children's cartoon, thick navy blue #243e5b outlines of the same weight, "
          "rounded friendly shapes, soft cartoon volume with highlight from the upper left and shading to the lower right. Not realistic, no texture noise. "
          "No text, no labels, no ground shadow, no background: genuine transparent background with wide transparent margins.")
SE = ("Reference image 1 is the APPROVED concept 'Ciempi Serpiente' (a cute legless candy-striped snake). Reference image 2 is the original approved Ciempi character (style reference). "
      "This is game-asset production: redraw parts of the snake from reference 1 as SEPARATE clean pieces, faithful to its design and colours. ")
CA = ("Reference image 1 is the APPROVED concept 'Ciempi Camaleon' (a cute rainbow chameleon caterpillar with turret eyes). Reference image 2 is the original approved Ciempi character (style reference). "
      "This is game-asset production: redraw parts of the chameleon from reference 1 as SEPARATE clean pieces, faithful to its design and colours. ")
DISCO = ("Reference image 3 is the original Ciempi head without cap. ")
P = {
 'serpiente-segmentos': SE + "Draw ONE horizontal row of FIVE separate body-segment pieces with wide transparent gaps between them (no overlaps, nothing touching), all at the same scale and resting on the same baseline, seen from the side like in the concept. "
   "Pieces 1, 2, 3 and 4 are the repeatable middle segments A, B, C, D: each one a COMPLETE plump glossy ball, slightly wider than tall, with the cream belly scutes (soft curved lines) on its lower third: A warm coral pink, B sunny yellow, C warm coral pink, D sunny yellow. "
   "A, B, C and D must have IDENTICAL size, outline and belly height so they can be chained. "
   "Piece 5 is the front neck segment: a coral pink ball about 10 percent bigger with the same cream belly. Draw every piece fully closed by its outline on all sides (also the parts that were hidden by overlaps in the concept). No legs, no head, no tail. "
   "IMPORTANT: draw the pieces LARGE: the five pieces together must fill almost the whole width of a wide landscape image, each ball about 350 pixels wide. " + ESTILO,
 'serpiente-cola': SE + "Draw ONE single piece: the rear tail segment of the snake: a COMPLETE plump glossy sunny yellow ball the same size as a body segment, with the cream belly scutes on its lower third; from its LEFT side a short soft tail tapers and curls upward, ending in a small coral pink heart-shaped tip, like the concept. "
   "Fully closed outline on all sides (its right side will be covered by the next segment in the game). Side view. No legs, no head. " + ESTILO,
 'serpiente-cabeza': SE + DISCO + "Draw ONLY the HEAD SKIN of the snake as one piece: a perfectly ROUND glossy warm coral pink disc with the same proportions as the head of reference 3 and a thick navy outline, "
   "with the soft cream muzzle patch of the concept on the LOWER RIGHT part of the disc (where the smile is in reference 3) and two tiny navy nostril dots on the upper part of that muzzle patch. "
   "Draw NO eyes, NO eyebrows, NO mouth, NO tongue and NO cheeks: those parts are added later by the game. Highlight on the upper left. " + ESTILO,
 'serpiente-lengua': SE + "Draw ONE single small piece: the cute pink forked tongue of the snake from the concept, seen from the front, hanging straight DOWN: a SLIM tongue about two and a half times longer than wide, slightly narrower at the top, that splits at its lower end into two small rounded tips (a little Y fork), with a lighter pink highlight and a thinner navy outline; it must not look like a tooth. Large in the frame. " + ESTILO,
 'camaleon-segmentos': CA + "Draw ONE horizontal row of FIVE separate body-segment pieces with wide transparent gaps between them (no overlaps, nothing touching), all at the same scale and resting on the same baseline, seen from the side like in the concept. "
   "Pieces 1, 2, 3 and 4 are the repeatable middle segments A, B, C, D: each one a COMPLETE plump glossy ball, slightly taller than wide, with a cream belly band on its lower part and a few rounded pink and yellow spots on top: A turquoise, B sea green, C fresh green, D lime green. "
   "A, B, C and D must have IDENTICAL size, outline and belly height so they can be chained. "
   "Piece 5 is the front chest segment: a lime green ball about 10 percent bigger with the same belly and spots. Draw every piece fully closed by its outline on all sides. No legs, no head, no tail. " + ESTILO,
 'camaleon-cola': CA + "Draw ONE single piece: the rear tail segment of the chameleon: a COMPLETE plump glossy turquoise ball the same size as a body segment, with a cream belly band on its lower part; from its upper LEFT side the long tail rises and curls into a neat round SPIRAL above and behind it, striped with lime, pink and yellow, like the concept. "
   "Fully closed outline on all sides (its right side will be covered by the next segment in the game). Side view. No legs, no head. " + ESTILO,
 'camaleon-pata': CA + "Draw TWO separate pieces side by side with a wide transparent gap: piece 1 is ONE short lime green chameleon LEG seen from the side, a rounded column about 1.6 times taller than wide; "
   "piece 2 is ONE prehensile chameleon FOOT seen from the side with the toes pointing to the RIGHT: two plump rounded cream toe bundles (one in front, one behind) like a little grip, flat underside, its top opening where the ankle joins the leg. "
   "Same scale and colours as the legs and feet in the concept. " + ESTILO,
 'camaleon-cabeza': CA + DISCO + "Draw ONLY the HEAD SKIN and CASQUE of the chameleon as one piece: a perfectly ROUND glossy lime green disc with the same proportions as the head of reference 3 and a thick navy outline, a cream throat band along its lower edge and two small yellow and pink spots on the upper right; "
   "on the top left of the disc the rounded casque crest of the concept, striped pink and yellow, its base overlapping the disc edge. "
   "Draw NO eyes, NO eyebrows, NO mouth and NO cheeks: those parts are added later by the game. Highlight on the upper left. " + ESTILO,
 'camaleon-torretas': CA + "Draw TWO separate pieces side by side with a wide transparent gap: the two chameleon TURRET EYELIDS of the concept WITHOUT the eyeballs: each one a round cone-shaped bulge of lime green scaly skin seen from the front, made of three or four concentric rounded rings (lime and pink) that narrow toward the centre, "
   "with a perfectly ROUND EMPTY HOLE in the middle where the eyeball will be placed (the hole is fully transparent). Piece 1 (left) is bigger, piece 2 (right) about 85 percent of its size. The rings are slightly offset toward the upper left so the cone looks like it points toward the viewer. " + ESTILO,
}
for k, v in P.items():
    open(os.path.join(d, 'textos', 'pieza-' + k + '.txt'), 'w').write(v + '\n')
print(len(P), 'prompts')
