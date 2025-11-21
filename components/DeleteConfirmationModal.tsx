'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    itemName?: string;
}

export default function DeleteConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    itemName
}: DeleteConfirmationModalProps) {
    const [confirmText, setConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setConfirmText('');
            setIsDeleting(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        if (confirmText.toLowerCase() !== 'confirmar') return;

        setIsDeleting(true);
        await onConfirm();
        setIsDeleting(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white border-2 border-red-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-6 border-b border-gray-200 flex items-start justify-between bg-gradient-to-r from-red-50 to-orange-50">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">Eliminar Análisis</h3>
                            <p className="text-sm text-gray-600">Esta acción no se puede deshacer</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <p className="text-gray-700 leading-relaxed">
                        Estás a punto de eliminar el análisis {itemName ? <span className="font-bold text-gray-900">"{itemName}"</span> : ''}.
                        Para confirmar, escribe <span className="font-bold text-red-600">confirmar</span> abajo:
                    </p>

                    <input
                        type="text"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder="Escribe 'confirmar'"
                        className="w-full bg-white border-2 border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all placeholder:text-gray-400"
                        autoFocus
                    />
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-gray-700 hover:text-gray-900 font-medium transition-colors hover:bg-gray-200 rounded-lg"
                        disabled={isDeleting}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={confirmText.toLowerCase() !== 'confirmar' || isDeleting}
                        className={`
              px-6 py-2.5 rounded-xl font-bold text-white transition-all flex items-center gap-2
              ${confirmText.toLowerCase() === 'confirmar'
                                ? 'bg-red-600 hover:bg-red-700 shadow-lg hover:shadow-xl'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
            `}
                    >
                        {isDeleting ? 'Eliminando...' : 'Eliminar'}
                    </button>
                </div>
            </div>
        </div>
    );
}
