# Next.js & Aptos Boilerplate

Un boilerplate moderno y listo para producción que combina un stack de frontend de alto rendimiento con todo lo necesario para empezar a desarrollar en la blockchain de Aptos.



## ✨ Características

* **Framework**: [Next.js 15](https://nextjs.org/) con App Router y Turbopack.
* **Estilos**: [Tailwind CSS 4](https://tailwindcss.com/) con una configuración optimizada.
* **Componentes**: Librería de componentes personalizables con [Shadcn/ui](https://ui.shadcn.com/).
* **Animaciones**: Animaciones fluidas y performantes con [Framer Motion](https://www.framer.com/motion/).
* **Calidad de Código**: Formateo y linting unificados y ultrarrápidos con [Biome](https://biomejs.dev/).
* **Blockchain**: Integración completa para desarrollo en [Aptos](https://aptos.dev/) con el Wallet Adapter y scripts para compilar y publicar contratos en Move.
* **Data Fetching**: Gestión de estado del servidor con [TanStack Query (React Query)](https://tanstack.com/query/latest).
* **Gestor de Paquetes**: Eficiencia y rapidez con [pnpm](https://pnpm.io/).

---

## 🚀 Cómo Empezar

Sigue estos pasos para levantar el entorno de desarrollo local.

### **1. Prerrequisitos**

* [Node.js](https://nodejs.org/en) (versión 20.x o superior)
* [pnpm](https://pnpm.io/installation)
* [Aptos CLI](https://aptos.dev/cli-tools/aptos-cli/install-aptos-cli)

### **2. Instalación**

1.  **Clona el repositorio:**
    ```bash
    git clone [https://github.com/tu-usuario/tu-repo.git](https://github.com/tu-usuario/tu-repo.git)
    cd tu-repo
    ```

2.  **Instala las dependencias:**
    ```bash
    pnpm install
    ```

### **3. Configuración del Entorno**

1.  **Crea tu archivo de entorno:**
    Copia el archivo `.env.example` y renómbralo a `.env.local`.
    ```bash
    cp .env.example .env.local
    ```

2.  **Configura las variables de entorno:**
    Abre `.env.local` y añade las claves y direcciones necesarias. Para desarrollo, se recomienda usar `devnet`.

    ```env
    # .env.local
    NEXT_PUBLIC_APTOS_NETWORK="devnet"
    NEXT_PUBLIC_PUBLISHER_ACCOUNT_ADDRESS="0x..."
    # Opcional, si tienes una API key de Aptos
    NEXT_PUBLIC_APTOS_API_KEY=""
    ```

---

## 🛠️ Scripts Disponibles

Este boilerplate viene con varios scripts para facilitar el desarrollo.

* **Iniciar el servidor de desarrollo:**
    ```bash
    pnpm dev
    ```
    Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

* **Crear una build de producción:**
    ```bash
    pnpm build
    ```

* **Ejecutar la build de producción:**
    ```bash
    pnpm start
    ```

* **Revisar y formatear el código:**
    ```bash
    # Revisar problemas de linting
    pnpm lint

    # Formatear todos los archivos
    pnpm format
    ```

### **Scripts para Contratos Move**

* **Compilar tus contratos Move:**
    ```bash
    pnpm move:compile
    ```

* **Publicar tus contratos en la red configurada en `.env.local`:**
    Este comando también genera los ABIs de TypeScript automáticamente.
    ```bash
    pnpm move:publish
    ```

---

## 📂 Estructura del Proyecto

```
.
├── app/                  # Rutas del App Router de Next.js
│   ├── layout.tsx        # Layout principal de la aplicación
│   └── page.tsx          # Página de inicio
├── components/           # Componentes de React reutilizables
│   ├── ui/               # Componentes base de Shadcn/ui (Button, Card, etc.)
│   ├── Header.tsx        # Cabecera de la aplicación
│   ├── MessageBoard.tsx  # Componente para interactuar con el contrato
│   ├── TransferAPT.tsx   # Componente para transferir APT
│   ├── WalletSelector.tsx# Componente para seleccionar y conectar wallets
│   └── *Provider.tsx     # Proveedores de contexto (Tema, Wallet, React Query)
├── contract/             # Código fuente de tus contratos Move
│   ├── sources/          # Archivos .move de tu contrato
│   ├── build/            # Artefactos de compilación del contrato (bytecode, etc.)
│   └── Move.toml         # Manifiesto del paquete de Move
├── lib/                  # Funciones de utilidad y lógica de cliente
│   ├── aptos/            # Lógica específica para la integración con Aptos
│   │   ├── abis/         # ABIs generados para interactuar con los contratos
│   │   ├── client.ts     # Instancia del cliente de Aptos SDK
│   │   ├── constants.ts  # Constantes de la red y direcciones
│   │   ├── queries/      # Funciones para leer datos de la blockchain
│   │   └── transactions/ # Lógica para construir transacciones
│   └── utils.ts          # Utilidades generales (ej. cn para Tailwind)
├── public/               # Archivos estáticos (imágenes, SVGs, etc.)
├── scripts/              # Scripts para automatizar tareas
│   └── move/             # Scripts para compilar, publicar y generar ABIs de Move
├── .env.local            # (No en el repo) Variables de entorno locales
├── biome.json            # Configuración de Biome (linter y formateador)
├── next.config.ts        # Configuración de Next.js
├── package.json          # Dependencias y scripts del proyecto
├── pnpm-lock.yaml        # Lockfile de PNPM para dependencias exactas
└── tsconfig.json         # Configuración de TypeScript para la aplicación
```

---

## 🎨 Personalización

* **Tema y Estilos**: Modifica los colores y estilos base en `app/globals.css` y `tailwind.config.js`.
* **Componentes Shadcn**: Añade nuevos componentes fácilmente con el comando:
    ```bash
    pnpm dlx shadcn@latest add [nombre-del-componente]
    ```

***
*Este boilerplate fue creado para acelerar el desarrollo de dApps en Aptos con un stack de frontend moderno y robusto.*
