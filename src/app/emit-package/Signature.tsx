'use client';
import React, { useRef, useState, useEffect } from 'react';
import { 
  PencilIcon, 
  TrashIcon, 
  CheckCircleIcon,
  ArrowLeftIcon,
  DocumentCheckIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as SolidCheckCircleIcon } from '@heroicons/react/24/solid';

interface SignatureProps {
  onBack: () => void;
  onSubmit: (signatureData: string) => void;
  customerName?: string;
}

const DigitalSignature: React.FC<SignatureProps> = ({ 
  onBack, 
  onSubmit, 
  customerName = "Client" 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configuration du canvas
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Style de dessin
    ctx.strokeStyle = '#1f2937'; // gray-800
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getEventPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const clientX = 'clientX' in e ? e.clientX : e.touches[0].clientX;
    const clientY = 'clientY' in e ? e.clientY : e.touches[0].clientY;

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    const pos = getEventPos(e);
    setLastPoint(pos);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing || !lastPoint) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const pos = getEventPos(e);

    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    setLastPoint(pos);
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    setLastPoint(null);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSubmit = async () => {
    if (!hasSignature) return;

    setIsSubmitting(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Convertir en base64
    const signatureData = canvas.toDataURL('image/png');
    
    // Simulation d'un délai de traitement
    setTimeout(() => {
      setShowSuccess(true);
      setTimeout(() => {
        onSubmit(signatureData);
      }, 1500);
    }, 1000);
  };

  if (showSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] animate-fadeIn">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6 animate-bounce">
            <SolidCheckCircleIcon className="w-12 h-12 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-green-700 mb-2">Signature Enregistrée !</h3>
          <p className="text-gray-600 mb-4">Votre signature a été enregistrée avec succès.</p>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <DocumentCheckIcon className="w-4 h-4" />
            <span>Traitement en cours...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 animate-fadeIn">
      {/* En-tête */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full shadow-xl mb-4 transform transition-all duration-500 hover:scale-110">
          <PencilIcon className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent mb-2">
          Signature Numérique
        </h2>
        <p className="text-gray-600 text-lg">
          {customerName}, veuillez signer dans l'espace ci-dessous pour confirmer l'expédition
        </p>
      </div>

      {/* Zone de signature */}
      <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden mb-6 transform transition-all duration-300 hover:shadow-2xl">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                <PencilIcon className="w-4 h-4 text-blue-600" />
              </div>
              <span className="font-semibold text-gray-700">Zone de Signature</span>
            </div>
            {hasSignature && (
              <div className="flex items-center space-x-2 text-green-600 text-sm font-medium">
                <CheckCircleIcon className="w-4 h-4" />
                <span>Signature détectée</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-6">
          <div className="relative">
            <canvas
              ref={canvasRef}
              className="w-full h-64 border-2 border-dashed border-gray-300 rounded-xl cursor-crosshair transition-all duration-300 hover:border-blue-400 focus:border-blue-500 focus:outline-none bg-gray-50"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            
            {!hasSignature && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center text-gray-400">
                  <PencilIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-lg font-medium">Signez ici</p>
                  <p className="text-sm">Utilisez votre doigt ou souris pour dessiner votre signature</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Boutons d'action */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <button
          onClick={onBack}
          className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium transition-all duration-200 hover:bg-gray-200 hover:shadow-md transform hover:-translate-y-0.5"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Retour
        </button>

        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={clearSignature}
            disabled={!hasSignature}
            className="flex items-center justify-center px-6 py-3 bg-red-50 text-red-600 rounded-xl font-medium transition-all duration-200 hover:bg-red-100 hover:shadow-md transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <TrashIcon className="w-5 h-5 mr-2" />
            Effacer
          </button>

          <button
            onClick={handleSubmit}
            disabled={!hasSignature || isSubmitting}
            className="flex items-center justify-center px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium transition-all duration-200 hover:from-green-600 hover:to-emerald-700 hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none min-w-[140px]"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                Enregistrement...
              </>
            ) : (
              <>
                <CheckCircleIcon className="w-5 h-5 mr-2" />
                Confirmer
              </>
            )}
          </button>
        </div>
      </div>

      {/* Informations légales */}
      <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-200">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full">
              <DocumentCheckIcon className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Valeur légale de la signature</p>
            <p className="text-blue-700">
              En signant électroniquement, vous confirmez avoir lu et accepté les conditions d'expédition. 
              Cette signature a la même valeur juridique qu'une signature manuscrite selon la réglementation en vigueur.
            </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { 
          animation: fadeIn 0.6s ease-out forwards; 
        }
        
        /* Prévention du zoom sur mobile lors du touch */
        canvas {
          touch-action: none;
        }
      `}</style>
    </div>
  );
};

export default DigitalSignature;