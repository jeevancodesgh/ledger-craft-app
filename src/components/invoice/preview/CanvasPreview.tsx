
import React, { useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';

interface CanvasPreviewProps {
  contentRef: React.RefObject<HTMLDivElement>;
}

const CanvasPreview = ({ contentRef }: CanvasPreviewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const renderToCanvas = async () => {
      if (!contentRef.current || !canvasRef.current) return;

      try {
        const canvas = await html2canvas(contentRef.current, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#FFFFFF',
          logging: false
        });

        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        // Set canvas dimensions to match the rendered content
        canvasRef.current.width = canvas.width;
        canvasRef.current.height = canvas.height;

        // Draw the content onto our display canvas
        ctx.drawImage(canvas, 0, 0);
      } catch (error) {
        console.error('Error rendering to canvas:', error);
      }
    };

    renderToCanvas();
  }, [contentRef]);

  return (
    <canvas 
      ref={canvasRef}
      className="w-full h-full"
      style={{ maxWidth: '100%' }}
    />
  );
};

export default CanvasPreview;
