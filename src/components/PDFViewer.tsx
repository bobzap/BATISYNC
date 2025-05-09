import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Définir le worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  url: string;
  className?: string;
}

export function PDFViewer({ url, className }: PDFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pdfDocRef = useRef<any>(null);

  const renderPage = async (pageNumber: number) => {
    if (!pdfDocRef.current) return;
    
    try {
      const page = await pdfDocRef.current.getPage(pageNumber);
      const canvas = canvasRef.current;
      if (!canvas) return;

      const viewport = page.getViewport({ scale });
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      const renderContext = {
        canvasContext: canvas.getContext('2d')!,
        viewport
      };
      
      await page.render(renderContext).promise;
    } catch (err) {
      console.error('Error rendering PDF page:', err);
      setError('Erreur lors du rendu de la page PDF');
    }
  };

  const loadPDF = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const loadingTask = pdfjsLib.getDocument(url);
      pdfDocRef.current = await loadingTask.promise;
      
      setNumPages(pdfDocRef.current.numPages);
      setPageNum(1);
      await renderPage(1);
    } catch (err) {
      console.error('Error loading PDF:', err);
      setError('Impossible de charger le PDF');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPDF();
    
    return () => {
      if (pdfDocRef.current) {
        pdfDocRef.current.destroy();
      }
    };
  }, [url]);

  useEffect(() => {
    if (pdfDocRef.current) {
      renderPage(pageNum);
    }
  }, [pageNum, scale]);

  const nextPage = () => {
    if (pageNum < numPages) {
      setPageNum(pageNum + 1);
    }
  };

  const prevPage = () => {
    if (pageNum > 1) {
      setPageNum(pageNum - 1);
    }
  };

  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 3));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));

  if (loading) {
    return <div className="flex justify-center items-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-full text-red-500">{error}</div>;
  }

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex justify-between items-center mb-4 p-2 bg-gray-100 dark:bg-gray-800 rounded">
        <div className="flex items-center gap-2">
          <button 
            onClick={prevPage} 
            disabled={pageNum <= 1}
            className="px-3 py-1 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            Précédent
          </button>
          <span>
            Page {pageNum} / {numPages}
          </span>
          <button 
            onClick={nextPage} 
            disabled={pageNum >= numPages}
            className="px-3 py-1 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            Suivant
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={zoomOut}
            className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded"
          >
            -
          </button>
          <span>{Math.round(scale * 100)}%</span>
          <button 
            onClick={zoomIn}
            className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded"
          >
            +
          </button>
        </div>
      </div>
      <div className="overflow-auto flex-grow flex justify-center">
        <canvas ref={canvasRef}></canvas>
      </div>
    </div>
  );
}