import React, { useState, useRef, useEffect } from 'react';
import { DocumentData } from '../types.ts';

interface DocumentViewerProps {
  document: DocumentData | null;
  hoveredFieldId: string | null;
  setHoveredFieldId: (id: string | null) => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ document, hoveredFieldId, setHoveredFieldId }) => {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  const viewerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  const handleZoomIn = () => setZoom(z => Math.min(z + 0.2, 3));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.2, 0.5));
  
  const handleFitToWidth = () => {
    if (viewerRef.current && imageRef.current && imageRef.current.naturalWidth > 0) {
        const viewerWidth = viewerRef.current.clientWidth;
        const imageWidth = imageRef.current.naturalWidth;
        setZoom(viewerWidth / imageWidth * 0.95);
        setPosition({x: 0, y: 0});
    }
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setImageSize({ width: e.currentTarget.naturalWidth, height: e.currentTarget.naturalHeight });
    setTimeout(handleFitToWidth, 50); // allow viewer to resize first
  };

  useEffect(() => {
    if (document) {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
      setImageSize({ width: 0, height: 0 });
    }
  }, [document?.id]);

  return (
    <div className="h-full bg-black/50 flex flex-col">
      <div className="p-2 bg-surface flex-shrink-0 flex items-center justify-between border-b border-gray-700">
        <span className="text-sm font-medium truncate pl-2">{document?.fileName || 'No document selected'}</span>
        <div className="flex items-center space-x-2">
            <button onClick={handleZoomOut} className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm">-</button>
            <span className="px-3 py-1 text-sm bg-gray-700 rounded w-16 text-center">{(zoom * 100).toFixed(0)}%</span>
            <button onClick={handleZoomIn} className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm">+</button>
            <button onClick={handleFitToWidth} className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm">Fit Width</button>
        </div>
      </div>
      <div ref={viewerRef} className="flex-grow overflow-hidden cursor-grab active:cursor-grabbing p-4 flex items-center justify-center">
        {document ? (
          <div 
              className="relative transition-transform duration-300" 
              style={{
                  transform: `scale(${zoom}) translate(${position.x}px, ${position.y}px)`,
                  transformOrigin: 'top left',
                  width: imageSize.width,
                  height: imageSize.height
              }}
          >
            <img 
              ref={imageRef}
              src={document.imageUrl} 
              alt={document.fileName}
              className="max-w-none h-auto w-auto shadow-lg" 
              onLoad={handleImageLoad}
            />
             {imageSize.width > 0 && (
                 <svg 
                    className="absolute top-0 left-0"
                    width={imageSize.width}
                    height={imageSize.height}
                    style={{ overflow: 'visible' }}
                >
                    {document.extractedFields.map(field => field.boundingBox && (
                        <polygon
                            key={field.id}
                            points={field.boundingBox.map(p => `${p.x * imageSize.width},${p.y * imageSize.height}`).join(' ')}
                            className={`transition-all duration-200 stroke-primary stroke-2 cursor-pointer pointer-events-auto ${
                                hoveredFieldId === field.id 
                                ? 'fill-primary/40' 
                                : 'fill-primary/20 hover:fill-primary/30'
                            }`}
                             onMouseEnter={() => setHoveredFieldId(field.id)}
                             onMouseLeave={() => setHoveredFieldId(null)}
                        />
                    ))}
                </svg>
             )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-text-dark">Select a document from the queue to view it here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentViewer;