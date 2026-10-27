-- La voz de Ciempi pasó de Piper a Kokoro (Alex y Dora). Se borra el audio
-- guardado con la voz anterior: el de antes de que la clave dijera la voz
-- ("nino|1|hola") y el de Piper ("piper:nino|1|hola").
delete from audios_voz
where split_part(clave, '|', 1) not like '%:%'
   or clave like 'piper:%';
