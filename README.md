# warrolight


*Prerequisitos*:

1. Tener node.js instalado o instalar de acá: https://nodejs.org/en/download/

*Instrucciones*:

1. Bajar el repo con `git clone`
1. Abrir una consola en el directorio `warrolight`
1. Correr `npm install` (eso va a instalar todos los paquetes, puede tardar)
1. Correr el backend desde `server/` con `npm start`
1. Correr el frontend desde `web/` con `npm start`
1. Ir a `http://localhost:3000` para probar

### Cómo agregar un programa de luces nuevo

Los programas de luces están en `src/function`. Pueden ver ahí varios ejemplos. Todos heredan de un par de clases útiles, la mayoría de `TimeTickedFunction`, que representa una función que una vez que X tiempo reporta los colores para toda la tira de luces.

Para agregar uno nuevo, pueden copiar uno simple como "all-white", ponerle un nombre nuevo a la copia, y agregar el nombre del archivo en `src/containers/main.jsx` línea 6.

En `mixRainbowTriangulos.js` pueden ver un ejemplo de agarrar varios programas distintos y componerlos asignándolos a distintas partes de la geometría de la W.
