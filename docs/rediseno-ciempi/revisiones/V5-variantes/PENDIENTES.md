# V5 variantes · pendientes

Revisión del agente, no aprobación: ninguna variante nueva está aprobada.

## Problemas encontrados
- **Patrones pequeños en Cuncuna.** A 320 px las hojitas de Bosque y los ramitos de Lavanda se ven poco, y a 84 px desaparecen. En esos casos la variante se reconoce solo por el color. Falta decidir si se agrandan o si se aceptan como «discretos».
- **Rostro teñido.** En Hielo y Blanco, el hocico toma el color del vientre (celeste) y la cara pierde algo de contraste. En Nocturno, en cambio, el hocico se dejó crema a propósito para que se lea.
- **Orejas y cuernos.** Las orejas del Dragón siguen el color de las escamas, mientras que en la IA quedaban menta. Es una decisión mía y se puede revisar.
- **Ojos k3 (Camaleón):**
  - Son un recorte del concepto, no un dibujo nuevo. A la torreta derecha le falta contorno en la zona donde el concepto la funde con la cabeza: lo añadí, pero en su borde inferior derecho queda una pequeña espina del contorno de la cabeza.
  - Para colocarlos donde están en k3, todo el grupo `#eyes` se transforma (×1,39, −5°). Por eso la línea de párpado que dibuja el rig durante el parpadeo sale algo más gruesa y ancha que el ojo. Solo verifiqué la estructura del parpadeo (2 ojos detectados por el rig), no su aspecto cuadro a cuadro.
  - Con lentes o con una máscara con agujeros, los ojos vuelven a su sitio B03 para coincidir con ellos, y las torretas los siguen: la torreta derecha ya no sobresale de la cabeza.
  - Boca y mejillas siguen siendo las capas v2 (k2a): las mejillas de escamas tocan el borde inferior de la torreta izquierda.
- **Sin variante, el Camaleón del laboratorio usa los ojos k2a.** Es la vista histórica y se dejó así para no romper comparaciones anteriores. Los ojos k3 se aplican al elegir cualquier variante: falta decidir si pasan a ser el valor por omisión.
- **Serpiente:**
  - s1, s3 y s4 usan la geometría y el rostro de s2, así que la punta de la cola es siempre el corazón de s2 (sin bola, estrella ni hoja). Con calzado, la punta queda tapada por la zapatilla.
  - Las propuestas de rostro **s2b «barbilla» y s2c «gota» no son variantes**: cada una tiene un único rostro (Alegre), sin las 14 expresiones ni separación de ojos para el parpadeo. Para convertirlas haría falta generar sus hojas de expresiones con IA, como en s2a. Se conservan en `T03-serpiente-v2/ia/`.
- **Paleta y camuflaje.** Con una variante elegida, la paleta y el camuflaje del Camaleón no se aplican: manda la variante.
- **Arcoíris y crecimiento.** El ciclo de colores se repite al crecer (A–D), así que entre el verde y el rosado hay un salto.

## Evidencia pendiente
- Faltan láminas con fondo oscuro, de crecimiento por variante y de cada animación por variante. Solo se hizo una carga con la animación A02 por variante.
- Falta la rúbrica 1–5 por variante y la aprobación de la usuaria.
