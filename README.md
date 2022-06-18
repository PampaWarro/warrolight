warrolight
==========

Software para simular y emitir programas audiorítmicos en tiras de luces LED. Utilizado en el Art Car Pampa Warro de Fuego Austral.

## Instalación

1. Instalar dependencias. En macOS con Homebrew el comando es:

```
brew install node yarn
```

En windows también hace falta python para el backend viejo de audio.

2. Clonar el repo de warrolight: 

```
git clone https://github.com/PampaWarro/warrolight.git
cd warrolight/
```

3. Instalar las dependencias del backend de audio:

```
cd audio/
yarn
```

Si el nuevo backend de audio node nativo (`rtaudio`) falla la instalación (en
macOS anda bien, en Windows ni idea), instalar el fallback viejo en Python.

```
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

### esp32 Olimex

Leer https://www.olimex.com/Products/IoT/ESP32/_resources/Arudino-ESP32.txt para compilar programas en arduino Ide

Ejemplos básicos de programa que usa ethernet: 
- https://raw.githubusercontent.com/espressif/arduino-esp32/1.0.3/libraries/WiFi/examples/ETH_LAN8720/ETH_LAN8720.ino
- https://github.com/OLIMEX/ESP32-POE/blob/master/SOFTWARE/ARDUINO/ESP32_PoE_Ethernet_Arduino/ESP32_PoE_Ethernet_Arduino.ino

Nota: El MTU default de esp32 y UDP es 1500 bytes. Al mandar paquetes más grandes nada falla pero nunca llegan.  
