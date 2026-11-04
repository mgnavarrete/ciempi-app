# Prompts de conceptos V4 (T03 Serpiente, T04 Camaleón). Escribe un .txt por concepto en ./textos/.
import os
d = os.path.dirname(os.path.abspath(__file__))
os.makedirs(os.path.join(d, 'textos'), exist_ok=True)
REFS = ("Reference image 1 is the approved character Ciempi (exact illustration style, head and face); reference image 2 is the same approved character without the cap; "
        "reference image 3 is an approved creature transformation of Ciempi (baby dragon) showing how a transformation keeps the same drawing language with its own body pieces.")
ESTILO = ("MUST PRESERVE from the references: the same flat 2D children's cartoon illustration language; thick navy blue #243e5b outlines of the same weight; rounded friendly shapes; "
          "soft cartoon volume with highlight from the upper left and shading to the lower right; body seen from the side moving to the right with the face turned toward the viewer; "
          "the big perfectly ROUND head on the right at the same size, with a kind expressive face: asymmetric eyes (viewer-left eye lower and larger, viewer-right eye higher and smaller), "
          "navy pupils with white highlights, small eyebrows, a happy open smile and soft coral cheeks. The head may take the creature's own skin colour and small own features. "
          "Original design: it must not resemble any existing licensed character. No text, no background scene, no ground shadow, genuine transparent background, the whole creature visible with generous margins.")
SERP = ("Create ONE full-body illustration of a NEW CREATURE TRANSFORMATION of Ciempi: 'Ciempi Serpiente', an adorable friendly cartoon SNAKE for a children's reading game. "
        "The snake has NO LEGS. Its body is a chain of FIVE plump overlapping rounded segments lying on the ground behind the head (the same segmented caterpillar language as Ciempi, so it can grow by adding segments), "
        "the segment next to the head rises a little like a short neck so the round head is held up proudly; the rearmost segment tapers into a short soft tail. "
        "Its head features: two tiny nostril dots above the smile and a small pink forked tongue peeking out of the smile. Cute, plump, gentle, never scary, no fangs. ")
CAM = ("Create ONE full-body illustration of a NEW CREATURE TRANSFORMATION of Ciempi: 'Ciempi Camaleon', an adorable friendly cartoon CHAMELEON for a children's reading game. "
       "Its body is a chain of FIVE plump overlapping rounded segments behind the head (the same segmented caterpillar language as Ciempi, so it can grow by adding segments) on short legs whose feet are cute prehensile chameleon grips (two rounded mitten-like toe bundles), "
       "the rearmost segment ends in a long tail CURLED into a neat spiral. Characteristic chameleon TURRET EYES: each of the two eyes sits inside a rounded cone-shaped bulge of scaly skin with concentric rings, still big, kind and expressive. "
       "Cute, gentle, never scary. ")
P = {
 'serpiente/s1-jardin': SERP + "Direction 'garden snake': mint and leaf green segments, each with a soft cream-yellow belly band below and a small rounded yellow diamond spot on top; the tail ends in a tiny round tip; the head is light green.",
 'serpiente/s2-caramelo': SERP + "Direction 'candy stripes': segments alternate warm coral pink and sunny yellow with a thin cream ring between them, cream belly; the tail ends in a small heart-shaped tip; the head is coral pink.",
 'serpiente/s3-noche': SERP + "Direction 'night sky': deep periwinkle blue and violet segments sprinkled with tiny cream star-shaped speckles, pale lilac belly; the tail ends in a small star-shaped tip; the head is periwinkle blue.",
 'serpiente/s4-hoja': SERP + "Direction 'sprout': turquoise segments with a lime green zigzag stripe along the back and cream belly; a tiny two-leaf sprout grows on top of the head; the tail ends in a little leaf; the head is turquoise.",
 'camaleon/k1-arcoiris': CAM + "Direction 'rainbow scales': segments in a gradient from lime green to turquoise with a few pink and yellow rounded spots, a small rounded casque crest on top of the head, cream throat; the turret eyes are lime green with pink rings.",
 'camaleon/k2-tropical': CAM + "Direction 'tropical leaf': bright leaf green segments with a soft white stripe along the side and orange spots, a scalloped low crest along the back; the turret eyes are green with yellow rings; orange-tipped spiral tail.",
 'camaleon/k3-atardecer': CAM + "Direction 'sunset': segments shading from coral orange to magenta pink with tiny yellow freckles, lilac belly, a small rounded casque on the head; turret eyes in orange with magenta rings; spiral tail in magenta.",
 'camaleon/k4-pastel': CAM + "Direction 'pastel mood': soft mint, sky blue and lavender pastel segments with cream rounded patches like little clouds, a tiny rounded head casque; turret eyes in mint with sky blue rings; spiral tail in lavender.",
}
for k, v in P.items():
    ruta = os.path.join(d, 'textos', k.replace('/', '-') + '.txt')
    open(ruta, 'w').write(REFS + '\n' + v + '\n' + ESTILO + '\n')
print(len(P), 'prompts')
