'use client';

import React, { useState } from 'react';

/**
 * DarkGlassDashboardExample
 * Ejemplo de integración del diseño Dark Glass Industrial con el dashboard actual
 * Muestra cómo aplicar el nuevo sistema de diseño
 */

interface ResistanceTest {
  id: string;
  name: string;
  species: string;
  samples: number;
  totalSamples: number;
  status: 'active' | 'completed' | 'pending';
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export const DarkGlassDashboardExample = () => {
  const [tests, setTests] = useState<ResistanceTest[]>([
    {
      id: '1',
      name: 'Test Resistencia L. vannamei',
      species: 'Camarón L. vannamei',
      samples: 120,
      totalSamples: 150,
      status: 'active',
      progress: 80,
      createdAt: '2024-11-18',
      updatedAt: '2024-11-18 10:30',
    },
    {
      id: '2',
      name: 'Test Resistencia F. brasiliensis',
      species: 'Camarón F. brasiliensis',
      samples: 85,
      totalSamples: 100,
      status: 'active',
      progress: 85,
      createdAt: '2024-11-17',
      updatedAt: '2024-11-18 09:15',
    },
    {
      id: '3',
      name: 'Test Completado - Nov 16',
      species: 'Camarón L. vannamei',
      samples: 150,
      totalSamples: 150,
      status: 'completed',
      progress: 100,
      createdAt: '2024-11-16',
      updatedAt: '2024-11-16 18:45',
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [showNotification, setShowNotification] = useState<{
    type: 'success' | 'warning' | 'error' | 'info';
    message: string;
  } | null>(null);

  const handleNewTest = () => {
    setShowNotification({
      type: 'info',
      message: 'Abriendo formulario para nuevo test...',
    });
  };

  const handleCompleteTest = (testId: string) => {
    setTests(
      tests.map((t) =>
        t.id === testId
          ? { ...t, status: 'completed', progress: 100, samples: t.totalSamples }
          : t
      )
    );
    setShowNotification({
      type: 'success',
      message: 'Test marcado como completado ✓',
    });
  };

  const handleDeleteTest = (testId: string) => {
    setTests(tests.filter((t) => t.id !== testId));
    setShowNotification({
      type: 'success',
      message: 'Test eliminado exitosamente',
    });
  };

  const filteredTests = tests.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.species.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCount = tests.filter((t) => t.status === 'active').length;
  const completedCount = tests.filter((t) => t.status === 'completed').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#0f1535] to-[#1a2847]">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md -webkit-backdrop-blur-md">
        <div className="glass-card m-4 animate-slideInDown">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">🦐 Análisis Descongelado</h1>
              <p className="text-[#9ca3af] text-sm md:text-base">Sistema de Gestión Dark Glass</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-[#06b6d4]">{tests.length}</div>
              <p className="text-xs text-[#6b7280]">Tests totales</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 md:py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 animate-slideInUp">
          <div className="glass-card dark">
            <div className="text-center">
              <div className="text-3xl font-bold text-[#06b6d4]">{activeCount}</div>
              <p className="text-[#9ca3af] text-sm mt-2">Tests Activos</p>
              <div className="mt-3 h-1 bg-gradient-to-r from-[#06b6d4] to-transparent rounded-full"></div>
            </div>
          </div>

          <div className="glass-card dark">
            <div className="text-center">
              <div className="text-3xl font-bold text-[#10b981]">{completedCount}</div>
              <p className="text-[#9ca3af] text-sm mt-2">Tests Completados</p>
              <div className="mt-3 h-1 bg-gradient-to-r from-[#10b981] to-transparent rounded-full"></div>
            </div>
          </div>

          <div className="glass-card dark">
            <div className="text-center">
              <div className="text-3xl font-bold text-[#8b5cf6]">
                {Math.round(
                  (tests.reduce((acc, t) => acc + t.samples, 0) /
                    (tests.reduce((acc, t) => acc + t.totalSamples, 0) || 1)) *
                    100
                )}
                %
              </div>
              <p className="text-[#9ca3af] text-sm mt-2">Progreso General</p>
              <div className="mt-3 h-1 bg-gradient-to-r from-[#8b5cf6] to-transparent rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Search and Actions */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar por nombre o especie..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex gap-2">
            <button className="btn-primary flex-1 md:flex-none">
              📊 Reporte
            </button>
            <button className="btn-success flex-1 md:flex-none" onClick={handleNewTest}>
              ➕ Nuevo Test
            </button>
          </div>
        </div>

        {/* Tests Grid */}
        <div className="space-y-4">
          {filteredTests.length === 0 ? (
            <div className="glass-card dark text-center py-12 animate-fadeIn">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-xl font-bold mb-2">No se encontraron tests</h3>
              <p className="text-[#9ca3af]">Intenta con otra búsqueda o crea un nuevo test</p>
            </div>
          ) : (
            filteredTests.map((test) => (
              <div
                key={test.id}
                className={`glass-card ${
                  test.status === 'active' ? 'accent-cyan' : ''
                } animate-slideInUp hover:scale-105 transition-transform`}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  {/* Left Section */}
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="text-2xl">
                        {test.status === 'active' ? '⚙️' : '✓'}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-[#f3f4f6]">{test.name}</h3>
                        <p className="text-sm text-[#9ca3af] mt-1">{test.species}</p>
                        <div className="flex gap-2 mt-2 text-xs">
                          <span className="text-[#6b7280]">
                            📅 {test.createdAt}
                          </span>
                          <span className="text-[#6b7280]">
                            🕐 {test.updatedAt}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Info */}
                    <div className="mt-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-[#9ca3af]">Progreso</span>
                        <span className="font-bold text-[#06b6d4]">{test.progress}%</span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-bar-fill"
                          style={{ width: `${test.progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-[#6b7280] mt-1">
                        <span>{test.samples} muestras procesadas</span>
                        <span>{test.totalSamples} muestras totales</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Section - Actions */}
                  <div className="flex gap-2 w-full md:w-auto flex-wrap md:flex-col">
                    <button className="btn-secondary flex-1 md:flex-none btn-sm">
                      👁️ Ver
                    </button>
                    <button
                      className="btn-secondary flex-1 md:flex-none btn-sm"
                      onClick={() =>
                        setShowNotification({
                          type: 'info',
                          message: `Editando: ${test.name}`,
                        })
                      }
                    >
                      ✏️ Editar
                    </button>

                    {test.status === 'active' && (
                      <button
                        className="btn-success flex-1 md:flex-none btn-sm"
                        onClick={() => handleCompleteTest(test.id)}
                      >
                        ✓ Completar
                      </button>
                    )}

                    <button
                      className="btn-danger flex-1 md:flex-none btn-sm"
                      onClick={() => handleDeleteTest(test.id)}
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.1)]">
                  <span
                    className={`badge ${
                      test.status === 'active'
                        ? 'badge-info'
                        : test.status === 'completed'
                        ? 'badge-success'
                        : 'badge-warning'
                    }`}
                  >
                    {test.status === 'active'
                      ? '🔄 Activo'
                      : test.status === 'completed'
                      ? '✓ Completado'
                      : '⏳ Pendiente'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Notifications */}
      {showNotification && (
        <div className="fixed bottom-4 right-4 z-toast animate-slideInUp max-w-sm">
          <div
            className={`glass-card border-l-4 ${
              showNotification.type === 'success'
                ? 'border-[#10b981]'
                : showNotification.type === 'error'
                ? 'border-[#ef4444]'
                : showNotification.type === 'warning'
                ? 'border-[#f97316]'
                : 'border-[#06b6d4]'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="text-xl">
                {showNotification.type === 'success'
                  ? '✓'
                  : showNotification.type === 'error'
                  ? '✕'
                  : showNotification.type === 'warning'
                  ? '⚠'
                  : 'ℹ'}
              </div>
              <div className="flex-1">
                <p className="text-[#f3f4f6]">{showNotification.message}</p>
              </div>
              <button
                onClick={() => setShowNotification(null)}
                className="text-[#6b7280] hover:text-[#f3f4f6] transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-[rgba(255,255,255,0.1)] mt-16 py-8">
        <div className="container mx-auto text-center text-[#6b7280]">
          <p>Dark Glass Industrial Design System • Optimizado para móvil y desktop</p>
        </div>
      </footer>
    </div>
  );
};

export default DarkGlassDashboardExample;
