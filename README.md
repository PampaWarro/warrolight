warrolight
==========

Software para simular y emitir programas audiorítmicos en tiras de luces LED. Utilizado en el Art Car Pampa Warro de Fuego Austral.

## Instalación

1. Asegurate de tener nodejs instalado en la computadora. En macOS se puede instalar con Homebrew:

```
brew install node
```

2. Clonar el repo de warrolight: 

```
git clone https://github.com/PampaWarro/warrolight.git
cd warrolight/
```

3. Instalar las dependencias del backend de audio:

```
cd audio/
yarn
pipenv install
```

Si no tenés `pipenv` instalalo primero con:

```
pip3 install pipenv
```

4. Instalar dependencias y levantar el servidor:

```
cd server/
yarn
yarn start
```

5. (En otra consola) instalar dependencias y levantar el frontend web:

```
cd web/
yarn
yarn start
```

6. Debería abrirse un browser en `http://localhost:3000` automáticamente. En caso contrario, podés visitar manualmente esa URL.


## Añadir programa de luces

Los programas de luces están en `server/src/light-programs/programs`. Ahí podrás encontrar varios ejemplos. Todos heredan de un par de clases útiles, la mayoría de `LightProgram`, que representa una función que una vez cada cierto tiempo emite los colores para toda la tira de luces.

Para añadir un programa nuevo, pueden copiar uno simple como "all-white", ponerle un nombre nuevo a la copia y agregar el nombre del archivo en `server/src/LightController.js` que contiene un listado de todos los programas habilitados.

En `PROGRAM_Transition.js` pueden ver un ejemplo de agarrar varios programas distintos y componerlos asignándolos a distintas partes de la geometría de la W.

### Arduino

Si estás familiarizado con la IDE de Arduino podés usarla para compilar y subir los scripts del directorio `arduino/`. Recordá configurar la localización del proyecto (sketchbook) al directorio `arduino/` de este repositorio.

Si preferís usar tu editor favorito, la herramienta `arduino-cli` también funciona muy bien. Podés encontrar instrucciones completas de cómo bajarla y usarla en https://github.com/arduino/arduino-cli.
