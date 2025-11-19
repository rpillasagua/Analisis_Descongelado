'use client';

import { useState } from 'react';

/**
 * DarkGlassShowcase - Componente de demostración del sistema Dark Glass Industrial
 * Muestra todos los estilos, colores, componentes y animaciones
 * Optimizado para móvil y escritorio
 */

export const DarkGlassShowcase = () => {
  const [activeTab, setActiveTab] = React.useState('colors');

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0a0e27] to-[#1a2847] p-4 md:p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-12">
        <div className="glass-card text-center mb-8 animate-slideInDown">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Dark Glass Industrial Design System
          </h1>
          <p className="text-[#9ca3af] text-lg">
            Premium mobile-first design con efectos de vidrio esmerilado
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {['colors', 'components', 'typography', 'examples'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap px-4 py-2 rounded-lg transition-all ${
                activeTab === tab
                  ? 'bg-[#06b6d4] text-[#0a0e27] font-bold'
                  : 'glass-card text-[#d1d5db] hover:text-[#06b6d4]'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* COLORS SECTION */}
        {activeTab === 'colors' && (
          <section className="space-y-8 animate-fadeIn">
            <h2 className="text-3xl font-bold mb-6">Paleta de Colores</h2>

            {/* Backgrounds */}
            <div className="glass-card dark">
              <h3 className="text-xl font-bold mb-4 text-[#06b6d4]">Backgrounds</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { name: 'Dark-0', bg: '#0a0e27' },
                  { name: 'Dark-1', bg: '#0f1535' },
                  { name: 'Dark-2', bg: '#1a2847' },
                  { name: 'Dark-3', bg: '#2a3a5a' },
                ].map((color) => (
                  <div key={color.name} className="text-center">
                    <div
                      className="w-full h-32 rounded-lg mb-3 border border-[rgba(255,255,255,0.1)]"
                      style={{ backgroundColor: color.bg }}
                    />
                    <p className="text-sm font-mono text-[#9ca3af]">{color.name}</p>
                    <p className="text-xs text-[#6b7280]">{color.bg}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Accent Colors */}
            <div className="glass-card dark">
              <h3 className="text-xl font-bold mb-4 text-[#06b6d4]">Accent Colors</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { name: 'Cyan', color: '#06b6d4' },
                  { name: 'Electric', color: '#8b5cf6' },
                  { name: 'Green', color: '#10b981' },
                  { name: 'Orange', color: '#f97316' },
                  { name: 'Red', color: '#ef4444' },
                  { name: 'Silver', color: '#c0c5d0' },
                ].map((color) => (
                  <div key={color.name} className="text-center">
                    <div
                      className="w-full h-32 rounded-lg mb-3 border border-[rgba(255,255,255,0.1)]"
                      style={{ backgroundColor: color.color }}
                    />
                    <p className="text-sm font-mono text-[#9ca3af]">{color.name}</p>
                    <p className="text-xs text-[#6b7280]">{color.color}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Glass Effects */}
            <div className="glass-card dark">
              <h3 className="text-xl font-bold mb-4 text-[#06b6d4]">Glass Effects</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { name: 'Light', opacity: 0.08 },
                  { name: 'Medium', opacity: 0.12 },
                  { name: 'Strong', opacity: 0.16 },
                ].map((glass) => (
                  <div key={glass.name} className="text-center">
                    <div
                      className="w-full h-32 rounded-lg mb-3 backdrop-blur-md border border-[rgba(255,255,255,0.1)]"
                      style={{
                        backgroundColor: `rgba(255, 255, 255, ${glass.opacity})`,
                      }}
                    />
                    <p className="text-sm font-mono text-[#9ca3af]">{glass.name}</p>
                    <p className="text-xs text-[#6b7280]">opacity: {glass.opacity}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* COMPONENTS SECTION */}
        {activeTab === 'components' && (
          <section className="space-y-8 animate-fadeIn">
            <h2 className="text-3xl font-bold mb-6">Componentes</h2>

            {/* Buttons */}
            <div className="glass-card dark">
              <h3 className="text-xl font-bold mb-4 text-[#06b6d4]">Buttons</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <button className="btn-primary">Primary</button>
                <button className="btn-secondary">Secondary</button>
                <button className="btn-outline">Outline</button>
                <button className="btn-success">Success</button>
                <button className="btn-danger">Danger</button>
                <button className="btn-primary btn-sm">Small</button>
                <button className="btn-primary btn-lg" style={{ gridColumn: '1 / -1' }}>
                  Large Button
                </button>
                <button className="btn-primary" disabled>
                  Disabled
                </button>
              </div>
            </div>

            {/* Cards */}
            <div className="glass-card dark">
              <h3 className="text-xl font-bold mb-4 text-[#06b6d4]">Glass Cards</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-card">
                  <h4 className="font-bold mb-2">Standard Card</h4>
                  <p className="text-[#9ca3af]">Efecto de vidrio esmerilado con blur</p>
                </div>
                <div className="glass-card dark">
                  <h4 className="font-bold mb-2">Dark Card</h4>
                  <p className="text-[#9ca3af]">Variante oscura para más contraste</p>
                </div>
                <div className="glass-card elevated">
                  <h4 className="font-bold mb-2">Elevated Card</h4>
                  <p className="text-[#9ca3af]">Mayor profundidad y sombra</p>
                </div>
                <div className="glass-card accent-cyan">
                  <h4 className="font-bold mb-2">Accent Cyan</h4>
                  <p className="text-[#9ca3af]">Con acentos de color cyan</p>
                </div>
              </div>
            </div>

            {/* Forms */}
            <div className="glass-card dark">
              <h3 className="text-xl font-bold mb-4 text-[#06b6d4]">Inputs</h3>
              <div className="space-y-4">
                <div>
                  <label className="block mb-2">Text Input</label>
                  <input type="text" placeholder="Escribe aquí..." />
                </div>
                <div>
                  <label className="block mb-2">Select</label>
                  <select>
                    <option>Opción 1</option>
                    <option>Opción 2</option>
                    <option>Opción 3</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-2">Textarea</label>
                  <textarea placeholder="Escribe un mensaje largo..."></textarea>
                </div>
              </div>
            </div>

            {/* Badges */}
            <div className="glass-card dark">
              <h3 className="text-xl font-bold mb-4 text-[#06b6d4]">Badges</h3>
              <div className="flex flex-wrap gap-3">
                <span className="badge badge-success">✓ Success</span>
                <span className="badge badge-warning">⚠ Warning</span>
                <span className="badge badge-error">✕ Error</span>
                <span className="badge badge-info">ℹ Info</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="glass-card dark">
              <h3 className="text-xl font-bold mb-4 text-[#06b6d4]">Progress</h3>
              <div className="space-y-4">
                {[25, 50, 75, 100].map((value) => (
                  <div key={value}>
                    <p className="text-sm mb-2 text-[#9ca3af]">{value}%</p>
                    <div className="progress-bar">
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* TYPOGRAPHY SECTION */}
        {activeTab === 'typography' && (
          <section className="space-y-8 animate-fadeIn">
            <h2 className="text-3xl font-bold mb-6">Tipografía</h2>

            <div className="glass-card dark">
              <h3 className="text-xl font-bold mb-4 text-[#06b6d4]">Headings</h3>
              <div className="space-y-6">
                <div>
                  <h1>Heading 1 - 2.5rem</h1>
                  <p className="text-[#6b7280] mt-2 font-mono text-sm">
                    letter-spacing: -0.5px
                  </p>
                </div>
                <div>
                  <h2>Heading 2 - 2rem</h2>
                  <p className="text-[#6b7280] mt-2 font-mono text-sm">
                    font-weight: 700
                  </p>
                </div>
                <div>
                  <h3>Heading 3 - 1.5rem</h3>
                  <p className="text-[#6b7280] mt-2 font-mono text-sm">
                    line-height: 1.2
                  </p>
                </div>
                <div>
                  <h4>Heading 4 - 1.25rem</h4>
                </div>
                <div>
                  <h5>Heading 5 - 1.125rem</h5>
                </div>
                <div>
                  <h6>Heading 6 - 1rem</h6>
                </div>
              </div>
            </div>

            <div className="glass-card dark">
              <h3 className="text-xl font-bold mb-4 text-[#06b6d4]">Body Text</h3>
              <div className="space-y-4">
                <div>
                  <p>
                    Párrafo normal - Lorem ipsum dolor sit amet, consectetur adipiscing
                    elit. Sed do eiusmod tempor incididunt ut labore et dolore magna
                    aliqua.
                  </p>
                  <p className="text-[#6b7280] mt-2 font-mono text-sm">
                    font-size: 1rem, line-height: 1.7
                  </p>
                </div>
                <div>
                  <small>
                    Texto pequeño - Ut enim ad minim veniam, quis nostrud exercitation
                  </small>
                  <p className="text-[#6b7280] mt-2 font-mono text-sm">
                    font-size: 0.875rem
                  </p>
                </div>
                <div>
                  <code>const message = 'Hello Dark Glass';</code>
                  <p className="text-[#6b7280] mt-2 font-mono text-sm">
                    Code block with syntax highlighting
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* EXAMPLES SECTION */}
        {activeTab === 'examples' && (
          <section className="space-y-8 animate-fadeIn">
            <h2 className="text-3xl font-bold mb-6">Ejemplos de Uso</h2>

            {/* Login Form */}
            <div className="glass-card dark">
              <h3 className="text-xl font-bold mb-6 text-[#06b6d4]">Login Form</h3>
              <form className="space-y-4 max-w-md">
                <div>
                  <label>Email</label>
                  <input type="email" placeholder="tu@email.com" />
                </div>
                <div>
                  <label>Password</label>
                  <input type="password" placeholder="••••••••" />
                </div>
                <button className="btn-primary w-full">Sign In</button>
              </form>
            </div>

            {/* Data Card */}
            <div className="glass-card accent-cyan">
              <h3 className="font-bold mb-4">Resistencia Test - Active</h3>
              <div className="space-y-3 text-[#9ca3af]">
                <div className="flex justify-between">
                  <span>Especie:</span>
                  <span className="text-[#f3f4f6]">Camarón L. vannamei</span>
                </div>
                <div className="flex justify-between">
                  <span>Muestras:</span>
                  <span className="text-[#f3f4f6]">120/150</span>
                </div>
                <div className="flex justify-between">
                  <span>Progreso:</span>
                  <span className="text-[#f3f4f6]">80%</span>
                </div>
                <div className="progress-bar mt-4">
                  <div
                    className="progress-bar-fill"
                    style={{ width: '80%' }}
                  />
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="glass-card dark">
              <h3 className="text-xl font-bold mb-4 text-[#06b6d4]">Notificaciones</h3>
              <div className="space-y-3">
                {[
                  { color: 'bg-[#10b981]', text: '✓ Test completado exitosamente' },
                  { color: 'bg-[#f97316]', text: '⚠ Verificar datos de muestra' },
                  { color: 'bg-[#ef4444]', text: '✕ Error al guardar datos' },
                  { color: 'bg-[#06b6d4]', text: 'ℹ Sincronización en curso...' },
                ].map((notif, i) => (
                  <div key={i} className={`${notif.color} p-3 rounded-lg text-white flex items-center gap-2`}>
                    {notif.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Animations Demo */}
            <div className="glass-card dark">
              <h3 className="text-xl font-bold mb-4 text-[#06b6d4]">Animaciones</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass-card animate-slideInUp text-center h-32 flex items-center justify-center">
                  <span className="text-sm">Slide In Up</span>
                </div>
                <div className="glass-card animate-slideInDown text-center h-32 flex items-center justify-center">
                  <span className="text-sm">Slide In Down</span>
                </div>
                <div className="glass-card animate-scaleIn text-center h-32 flex items-center justify-center">
                  <span className="text-sm">Scale In</span>
                </div>
                <div className="glass-card animate-glow text-center h-32 flex items-center justify-center">
                  <span className="text-sm">Glow</span>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Footer */}
      <div className="max-w-6xl mx-auto mt-16 text-center text-[#6b7280]">
        <p className="text-sm">
          Dark Glass Industrial Design System v1.0 • Optimizado para móvil y desktop
        </p>
      </div>
    </main>
  );
};

export default DarkGlassShowcase;
