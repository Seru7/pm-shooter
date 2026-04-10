# PM Shooter — Catálogo de armas y precios

Listado consolidado de las **168 armas** del campo de tiro [PM Shooter Warsaw](https://www.pmshooter.pl) con precio por disparo, calibre y foto. Un vistazo rápido para elegir antes de ir al campo — la web oficial tiene el arsenal y los precios en páginas separadas y sin tabla limpia.

🌐 **Publicado en**: https://seru7.github.io/pm-shooter/

## Features

- 168 armas con foto de alta calidad (descargadas del sitio oficial)
- Precio por disparo en **PLN** (oficial) y **EUR** (aproximado a 0,23 €/PLN)
- Filtros por categoría (Pistola / Revólver / Rifle / Carabina / SMG / Ametralladora / Escopeta)
- Filtros por sección del arsenal (Pequeño calibre / Combate / Automáticas)
- Buscador por nombre o calibre
- Toggle "solo precios confirmados" (esconde los inferidos por calibre)
- Orden por sección, precio asc/desc o nombre
- Dark theme, responsive, funciona offline una vez cargado

## Precios confirmados vs inferidos

- **Precio confirmado** (verde): el arma aparece nombrada explícitamente en la página [oferta](https://www.pmshooter.pl/index.php/pl/oferta) de PM Shooter → 71 armas.
- **Precio inferido** (amarillo, con `*`): el precio se calcula a partir del precio base del calibre → 97 armas. **Verificar in situ** antes de disparar.

## Regenerar datos (rebuild)

```bash
node scripts/build-data.mjs
```

Esto hace todo de una:
1. Descarga `https://www.pmshooter.pl/index.php/pl/arsenal`
2. Parsea las 168 armas + sus secciones
3. Descarga todos los thumbnails a `images/`
4. Aplica los diccionarios hardcodeados (`WEAPONS_META`, `PRICE_BY_CALIBER`)
5. Escribe `weapons.json`

Si añaden/quitan armas en la web oficial, hay que actualizar `WEAPONS_META` dentro de `scripts/build-data.mjs` para los slugs nuevos.

## Desarrollo local

```bash
python3 -m http.server 8080
# abrir http://localhost:8080
```

No hace falta Node para servir — solo para regenerar datos.

## Stack

- HTML + CSS + vanilla JS (sin frameworks)
- Node.js (solo para el script de build, usa `fetch` nativo, cero dependencias)
- Hosting: GitHub Pages

## Créditos

- Arsenal, precios e imágenes: [PM Shooter Warsaw](https://www.pmshooter.pl)
- Proyecto personal, sin ánimo de lucro
