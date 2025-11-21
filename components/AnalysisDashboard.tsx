                                  <span className="text-gray-500 font-medium text-xs">Código</span>
                                  <span className="text-gray-900 font-semibold">{analysis.codigo}</span>
                                </div >
{
  analysis.talla && (
    <div className="flex flex-col">
      <span className="text-gray-500 font-medium text-xs">Talla</span>
      <span className="text-gray-900 font-semibold">{analysis.talla}</span>
    </div>
  )
}
                              </div >
                            </div >

  {/* Right Side: Product Type & Analyst Color */ }
  < div className = "flex flex-col items-end gap-2" >
    <span className="text-sm font-bold text-gray-700 whitespace-nowrap px-3 py-1 bg-gray-100 rounded-lg">
      {PRODUCT_TYPE_LABELS[analysis.productType]}
    </span>
{
  analysis.analystColor && (
    <div
      className="w-10 h-10 rounded-full ring-4 ring-white shadow-lg transition-transform group-hover:scale-110"
      style={{ backgroundColor: analystColorHex, boxShadow: `0 4px 12px ${analystColorHex}60` }}
      title={`Analista: ${analysis.analystColor}`}
    />
  )
}
                            </div >
                          </div >

  <div className="flex items-center justify-between pt-3 border-t-2 border-gray-100 mt-3">
    {analysis.status !== 'COMPLETADO' ? (
      <div className="flex items-center justify-between w-full gap-3">
        <span className="text-sm font-semibold text-amber-600 flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-lg">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          En Progreso
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleComplete(analysis.id);
          }}
          className="text-sm font-semibold text-blue-600 hover:text-white hover:bg-blue-600 px-4 py-2 rounded-lg transition-all border-2 border-blue-600"
        >
          Completar
        </button>
      </div>
    ) : (
      <span className="text-sm font-semibold text-emerald-600 flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-lg">
        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
        Completado
      </span>
    )}
  </div>
                        </div >
                      );
                    })}
                  </div >
                </div >
              );
            })}
          </div >
        )
        }

<DailyReportModal
  isOpen={showReportModal}
  onClose={() => setShowReportModal(false)}
/>
      </div >
    </div >
  );
}
