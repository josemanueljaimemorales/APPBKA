# USAG Desarrollo Opcional 2026-2030: valores de elementos y reglas (notas de método)

Fecha: 2026-10-17. Archivos en esta carpeta:
- `usag_valores.json`: valor (A-E) por número USAG para BARRAS, VIGA y PISO. Incluye conteos, anotaciones, grupos, descripciones conocidas y número aproximado de símbolos por celda.
- `usag_saltos.json`: tablas de salto por nivel (6, 7, 8, 9, 10), cada una con número, nombre y SV. En L10 se marcan los saltos sin bono de +0.10.
- `usag_reglas.json`: reglas por nivel y aparato. Cubre la fórmula de SV, VP, SR, permitidos y restringidos, CV, CC, DV, composición, sustitución, ejercicio corto y el +0.10 extra de L10.

## 1. Método para los valores
1. Los apéndices 4 (UB), 5 (BB) y 6 (FX) del Dev COP 2026-30 son cuadrículas: las filas son grupo y fila; las columnas son A (.100) a E (.500). Los símbolos son imágenes rasterizadas.
2. Extracción automática con pdfplumber (`scripts/grid2.py`). Para cada imagen se tomó el centro de su bbox y se le asignó:
   - la columna, según las líneas verticales de la tabla;
   - la fila, según las líneas horizontales y la etiqueta "NN" de la fila.

   Se usan las líneas porque en piso las etiquetas van al pie de la celda.
3. Revisión visual de las 6 páginas renderizadas a 150 dpi, celda por celda. La extracción por líneas y la lectura visual coinciden en todas las celdas.
   - Los fallos del primer método (columna A perdida en la página 2 de UB y filas altas de piso) se corrigieron así.
4. El número se arma como `G.(columna)(fila)`. Ejemplo: grupo 5, fila 03, columna E = 5.503.

| Aparato | A | B | C | D | E | Total |
|---|---|---|---|---|---|---|
| Barras | 24 | 44 | 54 | 54 | 39 | 215 |
| Viga | 42 | 62 | 61 | 45 | 35 | 245 |
| Piso | 26 | 36 | 27 | 22 | 11 | 122 |

- No hay columnas F/G: en Dev USAG el valor máximo es E.
- Una celda puede tener varios símbolos (variantes del mismo número). El conteo de imágenes por celda es solo orientativo.

### Verificaciones cruzadas (todas coinciden)
- **Cambios de valor (CHG26)**, presentes con la letra nueva:
  - UB 5.503 E.
  - BB 2.201 B, 2.202 B, 2.302 C, 2.207 B y 9.406 D.
- **Elementos nuevos**:
  - BB 3.506 E (Graba, 2026).
  - BB 2.501 E (Pennucci, 2025).
  - UB 7.203 B (variante 2026).
  - UB 6.401 D (Healy en stalder, que pasó de 6.301 C en 2025).
- **Lista de AP7** para el CV de +0.20 en UB: 3.401, 6.405, 7.410, 7.510, 2.406, 4.406, 4.506 y 5.503. Todos existen como D/E.
- **Números del COP 2022-26** (páginas revisadas en `historico/`) que siguen en la misma celda:
  - 3.401 Shaposhnikova D, 4.406 Pak D, 4.407 Gienger D, 5.405 Jaeger D, 7.410 Maloney D.
  - 8.505 double layout E, 3.407 Weiler a parada D, 1.414 D, 4.202 gigante B.

## 2. ¿La numeración es la de FIG? **No.**
- **Distinta estructura de grupos.**
  - FIG 2025-28: UB tiene 6 grupos (entradas, casts/clear hip, gigantes, stalder, pike circles, salidas); BB tiene 6; FX tiene 5.
  - USAG: UB tiene 8 grupos (5 = gigantes adelante, 6 = stalder); BB tiene 9 (6 = rolls); FX tiene 8.
- **Ejemplos del mismo elemento con número distinto**:

  | Elemento | USAG | FIG 2025 |
  |---|---|---|
  | Ejova | 5.503 (E) | 3.407 |
  | Sissonne | BB 2.207 (B) | 2.108 (A) |
  | Desde posición cruzada, salto con ¼ a split jump | BB 2.201 (B) | 2.202 (split jump cruzado), con otro valor |
  | Front 2/1 | FX 6.501 | grupo 4 de FIG |

- **La numeración USAG es propia y estable desde el Dev COP 2022-26.** Probablemente viene de un ciclo FIG anterior a 2013, con UB en 8 grupos. No lo verifiqué: no conseguí un CoP FIG 2009-12 público.
- **En USAG la centena codifica el valor.** Si el valor cambia, cambia el número:
  - Ejova: 5.403 D → 5.503 E.
  - Sissonne: 2.107 A → 2.207 B.
  - 2/1 de viga: 9.306 C → 9.406 D.

  Las guías de TX NAWGJ (A. Stroud) y el blog thegymnasticsguide citan los números viejos (5.403, 9.306). La fuente oficial (CHG26) usa los nuevos.
- **Relación con los valores FIG**: no se pueden mapear número por número. Para importar un elemento FIG hay que identificarlo por descripción y buscar su celda USAG.
- **Valor de cada letra en USAG**: A = 0.10, B = 0.30 y C = 0.50 de VP. D y E valen C para VP y dan bono. No se suman como en el D-score FIG.
- **Saltos**: numeración propia USAG (grupos I-V), con SV fijo por nivel. No usa la tabla FIG.

## 3. Reglas
- Las fuentes principales son ERC 2026-30, AP7/AP8 (cheat sheets) y AP1-3 (saltos).
- Se complementan con:
  - la presentación 2026-27 (DEVUPD);
  - las minutas de 2025 y 2026;
  - las guías no oficiales de TX NAWGJ (QRG de A. Stroud, mayo 2026);
  - las hojas de J. Eyman (agosto 2026).
- Las hojas de Eyman aclaran el CV de UB en L9: C+C vale +0.10 si uno o ambos no tienen giro/vuelo (y son distintos), y +0.20 si ambos tienen giro o vuelo. En AP7 esa fila es ambigua.
- Algunas reglas generales vienen del COP 2022-26 (marcadas OLD en el JSON):
  - reemplazo 1 a 1;
  - repetición máxima de 2 veces en conexión distinta;
  - lógica cronológica de restringidos;
  - DV: D +0.10, E +0.20 en L10.

  Pueden haber cambiado en el texto 2026-30.

## 4. Fuentes extra descargadas (`fuentes/usag/extra/`)
- `qrg_bars_6.1.pdf`, `qrg_beam_6.1.pdf`, `qrg_floor_6.1.pdf` y `qrg_all_6.1.pdf`: TX NAWGJ, guías rápidas L10 (txnawgj.org, item 799).
- `eyman_scoresheets/L{6..10}_SCORESHEET_{BARS,BEAM,FLOOR}_2026-08-19.pdf`: hojas de juez de J. Eyman (carpeta pública de Drive enlazada en txnawgj.org, item 800).
- Hay archivos `.txt` extraídos al lado de cada PDF.
- No se encontró ninguna lista pública de elementos con descripción, ni un FAQ oficial USAG de 2026-30 publicado después de agosto de 2026. La búsqueda solo arrojó:
  - el blog thegymnasticsguide.com;
  - un examen de práctica L10 de NAWGJ (el enlace devolvió HTML, no se descargó).

## 5. Incertidumbres y huecos
- **Descripciones de elementos**: solo hay unas 50 (ver `descripciones_conocidas`). Las demás (≈530) son números con valor y sin texto; el texto está en el COP de pago (VitalSource, $80).
- **Nombres de los grupos**: varios son inferidos (marcados en `_grupos`).
- **Piso 8.504 / 8.505**: la celda E está combinada en el PDF. Registré ambos como E (confianza media).
- **DV de E en L10** (+0.20) y la mecánica fina de restringidos y repetición: vienen del COP 2022-26, sin confirmar en 2026.
- **Salto**: no hay en lo público cuántos saltos cuentan (mejor o promedio) para L6-10.
- **Deducciones de ejecución**: no están estructuradas en el JSON (están en AP7/AP8, AP13/AP14 y en los TXT).
