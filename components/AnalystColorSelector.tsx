'use client';
fillRule = "evenodd"
d = "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
clipRule = "evenodd"
    />
                                    </svg >
                                </div >
                            )}
                        </button >
                    );
                })}
            </div >

    {!selectedColor && (
        <p className="text-sm text-gray-600 mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
            💡 Este color te identificará en todos los análisis que realices hoy
        </p>
    )}
        </div >
    );
}
