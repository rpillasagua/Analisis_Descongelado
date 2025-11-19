# 🎨 Dark Glass Industrial Design System - Guía de Uso

## 📋 Índice
1. [Introducción](#introducción)
2. [Instalación](#instalación)
3. [Sistema de Colores](#sistema-de-colores)
4. [Componentes](#componentes)
5. [Responsive Design](#responsive-design)
6. [Animaciones](#animaciones)
7. [Ejemplos Prácticos](#ejemplos-prácticos)
8. [Mobile Optimization](#mobile-optimization)

---

## 🎯 Introducción

**Dark Glass Industrial** es un sistema de diseño moderno que combina:
- ✨ Efectos de vidrio esmerilado (glassmorphism)
- 🏭 Estética industrial con colores metálicos
- 📱 Optimización completa para móvil
- ♿ Accesibilidad y contraste máximo
- 🚀 Animaciones suaves y profesionales

**Características principales:**
- Colores industriales (azules, grises, cyans)
- Componentes glass-card con blur backdrop
- Sistema de espaciado modular
- Tipografía Inter + Space Mono
- Respuesta rápida en móvil (touch-friendly)

---

## 🚀 Instalación

### 1. Reemplazar stylesheet global

En `app/layout.tsx`, cambiar la importación:

```tsx
// ANTES:
import './globals.css';

// DESPUÉS:
import './globals-darkglass.css';
```

### 2. Verificar que Next.js está configurado para CSS

```json
// next.config.mjs
const nextConfig = {
  experimental: {
    cssInline: false,
  },
};
```

### 3. Verificar TypeScript (opcional pero recomendado)

```json
// tsconfig.json
{
  "compilerOptions": {
    "types": ["node"]
  }
}
```

---

## 🎨 Sistema de Colores

### Backgrounds
```css
--bg-dark-0: #0a0e27;  /* Negro profundo */
--bg-dark-1: #0f1535;  /* Azul noche */
--bg-dark-2: #1a2847;  /* Azul profundo */
--bg-dark-3: #2a3a5a;  /* Azul grisáceo */
```

### Glass Effects (Vidrio Esmerilado)
```css
--glass-light: rgba(255, 255, 255, 0.08);
--glass-medium: rgba(255, 255, 255, 0.12);
--glass-strong: rgba(255, 255, 255, 0.16);
```

### Colores de Acento
```css
--accent-cyan: #06b6d4;         /* Primario */
--accent-electric: #8b5cf6;     /* Secundario */
--accent-green: #10b981;        /* Success */
--accent-orange: #f97316;       /* Warning */
--accent-red: #ef4444;          /* Error */
```

### Uso en HTML
```html
<!-- Fondo -->
<div style="background: var(--bg-dark-1)">Fondo</div>

<!-- Texto -->
<p style="color: var(--text-light)">Texto claro</p>

<!-- Borde -->
<div style="border: 1px solid var(--border-medium)">Borde</div>

<!-- Sombra -->
<div style="box-shadow: var(--shadow-lg)">Sombra</div>
```

---

## 🧩 Componentes

### 1. Glass Card

**Componente principal** - efecto de vidrio esmerilado

```html
<!-- Standard -->
<div class="glass-card">
  <h3>Título</h3>
  <p>Contenido aquí</p>
</div>

<!-- Variantes -->
<div class="glass-card dark">Versión oscura</div>
<div class="glass-card elevated">Versión elevada</div>
<div class="glass-card accent-cyan">Con acento cyan</div>
```

### 2. Botones

```html
<!-- Primary (Cyan) -->
<button class="btn-primary">Aceptar</button>

<!-- Secondary (Glass) -->
<button class="btn-secondary">Cancelar</button>

<!-- Outline -->
<button class="btn-outline">Outline</button>

<!-- Success -->
<button class="btn-success">✓ Completar</button>

<!-- Danger -->
<button class="btn-danger">✕ Eliminar</button>

<!-- Tamaños -->
<button class="btn-sm">Pequeño</button>
<button class="btn-lg">Grande</button>

<!-- Estados -->
<button disabled>Deshabilitado</button>
```

### 3. Inputs

```html
<!-- Text -->
<label>Email</label>
<input type="email" placeholder="tu@email.com" />

<!-- Select -->
<select>
  <option>Opción 1</option>
  <option>Opción 2</option>
</select>

<!-- Textarea -->
<textarea placeholder="Escribe aquí..."></textarea>
```

### 4. Badges

```html
<span class="badge badge-success">✓ Completado</span>
<span class="badge badge-warning">⚠ Alerta</span>
<span class="badge badge-error">✕ Error</span>
<span class="badge badge-info">ℹ Info</span>
```

### 5. Progress Bar

```html
<div class="progress-bar">
  <div class="progress-bar-fill" style="width: 75%"></div>
</div>
```

---

## 📱 Responsive Design

### Mobile First Approach

```css
/* Mobile (< 640px) - Base */
.button { width: 100%; min-height: 44px; }

/* Tablet (641px - 1024px) */
@media (min-width: 641px) {
  .button { width: auto; min-height: 40px; }
}

/* Desktop (1025px+) */
@media (min-width: 1025px) {
  .button { min-height: 36px; }
}
```

### Utilities de Layout

```html
<!-- Flexbox -->
<div class="flex gap-2">
  <button>Btn 1</button>
  <button>Btn 2</button>
</div>

<!-- Grid -->
<div class="grid grid-cols-2 md:grid-cols-3 gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>

<!-- Spacing -->
<div class="p-4 mt-2 mb-4 gap-2">Contenido</div>
```

---

## ✨ Animaciones

### Animaciones Disponibles

```html
<!-- Fade In -->
<div class="animate-fadeIn">Aparece suavemente</div>

<!-- Slide In Up -->
<div class="animate-slideInUp">Sube y aparece</div>

<!-- Slide In Down -->
<div class="animate-slideInDown">Baja y aparece</div>

<!-- Scale In -->
<div class="animate-scaleIn">Se agranda al aparecer</div>

<!-- Glow -->
<div class="animate-glow glass-card">Brilla continuamente</div>

<!-- Pulse -->
<div class="animate-pulse">Parpadea sutilmente</div>

<!-- Spin -->
<div class="animate-spin">Gira continuamente</div>
```

---

## 📋 Ejemplos Prácticos

### Login Form

```tsx
export const LoginForm = () => {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0e27] to-[#1a2847]">
      <div className="glass-card max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">Iniciar Sesión</h1>
        
        <form className="space-y-4">
          <div>
            <label>Email</label>
            <input type="email" placeholder="tu@email.com" />
          </div>
          
          <div>
            <label>Contraseña</label>
            <input type="password" placeholder="••••••••" />
          </div>
          
          <button className="btn-primary w-full">Conectar</button>
        </form>
      </div>
    </main>
  );
};
```

### Data Card - Test Active

```tsx
export const TestCard = () => {
  return (
    <div className="glass-card accent-cyan">
      <h3 className="font-bold mb-4">Resistencia Test - Active</h3>
      
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-[#9ca3af]">Especie:</span>
          <span className="text-[#f3f4f6]">Camarón L. vannamei</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-[#9ca3af]">Muestras:</span>
          <span className="text-[#f3f4f6]">120/150</span>
        </div>
        
        <div className="progress-bar mt-4">
          <div className="progress-bar-fill" style={{ width: '80%' }}></div>
        </div>
      </div>
      
      <div className="flex gap-2 mt-6">
        <button className="btn-secondary flex-1">Ver Datos</button>
        <button className="btn-success flex-1">Completar</button>
      </div>
    </div>
  );
};
```

### Notifications Stack

```tsx
export const NotificationStack = () => {
  return (
    <div className="fixed bottom-4 right-4 space-y-3 z-toast">
      <div className="glass-card accent-cyan border-l-4 border-[#06b6d4]">
        <p>✓ Datos guardados correctamente</p>
      </div>
      
      <div className="glass-card border-l-4 border-[#f97316]">
        <p>⚠ Por favor verifica los datos</p>
      </div>
      
      <div className="glass-card border-l-4 border-[#ef4444]">
        <p>✕ Error: No se pudo conectar</p>
      </div>
    </div>
  );
};
```

---

## 📱 Mobile Optimization

### Breakpoints

```css
/* Mobile */
@media (max-width: 640px) {
  /* Base styles */
}

/* Tablet */
@media (min-width: 641px) and (max-width: 1024px) {
  /* Tablet styles */
}

/* Desktop */
@media (min-width: 1025px) {
  /* Desktop styles */
}

/* Extra Large */
@media (min-width: 1920px) {
  /* XL styles */
}
```

### Touch-Friendly Design

```css
/* Botones con mínimo 44x44px en móvil */
button {
  min-height: 44px;
  padding: 12px 16px;
}

/* Inputs con tamaño de fuente 16px para evitar zoom en iOS */
input {
  font-size: 16px;
  padding: 12px 14px;
}

/* Espaciado generoso para evitar clicks accidentales */
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
.gap-4 { gap: 16px; }
```

### Performance en Móvil

1. **Blur y Backdrop Filter:**
   - CSS nativo `backdrop-filter: blur()` 
   - `-webkit-backdrop-filter` para iOS
   - No requiere JavaScript

2. **Animaciones:**
   - Respetan `prefers-reduced-motion`
   - GPU-accelerated con `transform` y `opacity`
   - Transiciones suaves (0.3s default)

3. **Touch Interactions:**
   - `-webkit-tap-highlight-color: transparent`
   - Active states claros
   - Hover states solo en desktop

---

## 🎓 Tips Avanzados

### 1. Tema Personalizado

Modificar variables en `:root`:

```css
:root {
  --accent-cyan: #00d4ff;  /* Tu color */
  --bg-dark-0: #000000;    /* Tu fondo */
}
```

### 2. Dark Mode Manual

```html
<html data-theme="dark">
  <!-- El sistema ya es dark mode por defecto -->
</html>
```

### 3. Animaciones Personalizadas

```css
@keyframes mi-animacion {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-custom {
  animation: mi-animacion 0.5s ease-out;
}
```

### 4. Accesibilidad

```html
<!-- Focus visible -->
<button class="focus:outline-none focus:ring-2 focus:ring-[#06b6d4]">
  Accesible
</button>

<!-- aria-labels -->
<button aria-label="Cerrar modal">✕</button>

<!-- Contraste verificado -->
<!-- WCAG AA: 4.5:1 para texto, 3:1 para UI -->
```

---

## 📊 Comparación: Light vs Dark

| Aspecto | Light | Dark Glass |
|---------|-------|-----------|
| Fondo | #F3F4F6 | #0a0e27 |
| Texto | #1F2937 | #f3f4f6 |
| Acento | #3B82F6 | #06b6d4 |
| Efecto | Sombra | Blur + Vidrio |
| Móvil | ⚠️ Fuerte brillo | ✅ Comfortable |
| Batería | ❌ +10% | ✅ -15% OLED |
| Profesional | ✅ Estándar | ✅ Premium |

---

## 🐛 Troubleshooting

### Blur no funciona en móvil
- ✅ Verificar que `-webkit-backdrop-filter` está presente
- ✅ Probar en iOS Safari (la mejor compatibilidad)
- ✅ Fallback a `background` si blur no está soportado

### Colores se ven desaturados
- ✅ Aumentar `saturate()` en backdrop-filter
- ✅ Reducir opacidad de `glass-light` si es muy fuerte

### Animaciones lentas
- ✅ Usar `transform` y `opacity` (GPU-accelerated)
- ✅ Evitar `width` y `height` en animaciones
- ✅ Reducir `duration` a 0.2-0.3s

### Touch targets pequeños
- ✅ Mínimo 44x44px en móvil
- ✅ Agregar `padding` alrededor de botones
- ✅ Aumentar `gap` entre elementos

---

## 📚 Recursos

- [Glassmorphism](https://glassmorphism.com/)
- [Inter Font](https://fonts.google.com/specimen/Inter)
- [CSS Backdrop Filter](https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter)
- [WCAG Accessibility](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Versión:** 1.0.0  
**Última actualización:** Noviembre 2024  
**Compatibilidad:** iOS 12+, Android 6+, Chrome 76+
