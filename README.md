# XOR Neural Lab

Simulador educativo interactivo de una **red neuronal multicapa (2-2-1)** para aprender la función lógica **XOR**. La aplicación permite explorar paso a paso el forward pass, el cálculo del error, la retropropagación y la actualización de pesos/sesgos, con visualización de parámetros, gráficas y comparación de resultados.

## Características

- **Arquitectura 2-2-1**: 2 neuronas de entrada, 2 en capa oculta y 1 de salida (activación sigmoide).
- **Entrenamiento paso a paso**: avance por micro-fases (cálculo de `h1`, `h2`, `o1`, error, deltas y actualización de parámetros).
- **Entrenamiento automático**: ejecución continua con distintas velocidades.
- **Configuración**: tasa de aprendizaje, MSE objetivo, máximo de épocas y orden de entrenamiento de los ejemplos.
- **Órdenes de entrenamiento**: orden original y orden de demostración tipo PDF.
- **Visualización**:
  - Diagrama de la red.
  - Sección matemática con fórmulas y valores intermedios (KaTeX).
  - Gráficas de evolución (MSE por época, etc.) con Recharts.
  - Historial de iteraciones/épocas y comparación de estados.
- **Reporte/exportación**: generación de reporte (incluye soporte con `jspdf`).
- **Pruebas**: tests unitarios para la lógica matemática con Vitest.

## Stack tecnológico

- [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/) (desarrollo y build)
- [Tailwind CSS](https://tailwindcss.com/) (estilos)
- [KaTeX](https://katex.org/) (renderizado matemático)
- [Recharts](https://recharts.org/) (gráficas)
- [Lucide React](https://lucide.dev/) (iconos)
- [jsPDF](https://github.com/parallax/jsPDF) (exportación/reporte)
- [Vitest](https://vitest.dev/) (testing)

## Requisitos previos

- [Node.js](https://nodejs.org/) (recomendado: versión LTS reciente)
- npm (incluido con Node.js)

## Instalación

```bash
npm install
```

## Ejecución en desarrollo

```bash
npm run dev
```

Luego abre la URL que muestre Vite en la terminal (normalmente `http://localhost:5173`).

## Scripts disponibles

- `npm run dev` — Inicia el servidor de desarrollo.
- `npm run build` — Compila TypeScript y genera el build de producción con Vite.
- `npm run preview` — Sirve localmente el build generado.
- `npm test` — Ejecuta las pruebas con Vitest.
- `npm run test:watch` — Ejecuta Vitest en modo watch.

## Estructura del proyecto

```text
.
├─ index.html
├─ public/
├─ src/
│  ├─ App.tsx                    # Estado principal y orquestación del entrenamiento
│  ├─ main.tsx                   # Punto de entrada React
│  ├─ index.css                  # Estilos globales (Tailwind)
│  ├─ components/
│  │  ├─ ConfigurationSection.tsx
│  │  ├─ StepTrainingSection.tsx
│  │  ├─ NetworkDiagram.tsx
│  │  ├─ MathView.tsx
│  │  ├─ ChartsSection.tsx
│  │  ├─ ComparisonSection.tsx
│  │  └─ ReportSection.tsx
│  ├─ lib/
│  │  ├─ math.ts                 # Forward pass, backprop, MSE y utilidades
│  │  ├─ math.test.ts            # Pruebas de la lógica matemática
│  │  └─ export.ts               # Lógica de exportación/reporte
│  └─ types/
│     └─ network.ts              # Tipos y contratos del dominio
├─ package.json
└─ vite.config.ts
```

## Notas académicas

- Dataset XOR utilizado: `(0,1)->1`, `(1,0)->1`, `(1,1)->0`, `(0,0)->0`.
- La implementación expone el proceso de entrenamiento de forma didáctica (iteración, época, ejemplo actual y fases internas).
- Los parámetros iniciales y el comportamiento del entrenamiento están orientados a fines educativos y de visualización del algoritmo. 

## Licencia

ISC (según `package.json`).
