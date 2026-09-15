# Redragon K552 RGB SignalRGB Plugin

Plugin independiente para [SignalRGB](https://signalrgb.com/) del **Redragon K552 Kumara RGB** de 87 teclas (formato TKL).

El plugin se comunica directamente con el controlador EVision del K552 RGB:

- VID: `0x0C45`
- PID: `0x5104`
- HID usage page: `0xFF1C`
- Buffer RGB: 126 posiciones, enviado en 7 paquetes de 54 bytes

Incluye un mapa ANSI TKL de 87 teclas y activa el modo personalizado para que SignalRGB pueda controlar el color de cada tecla.

## Instalación

1. Copia `Redragon_K552.js` en:
   `%USERPROFILE%\Documents\WhirlwindFX\Plugins`
2. Cierra SignalRGB completamente, también desde la bandeja del sistema.
3. Vuelve a abrir SignalRGB y entra en Devices.
4. Busca **Redragon K552 RGB Custom**.

## Notas

Este plugin está preparado para el K552 RGB basado en EVision. Las variantes K552 de iluminación roja fija, rainbow no direccionable o las revisiones inalámbricas usan otro hardware y no son compatibles con este perfil.

## Créditos

- Mapa físico ANSI TKL de 87 teclas.
- Protocolo de color EVision estándar para el K552 (`0x0C45:0x5104`).
