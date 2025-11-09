import React, { useState, useCallback } from 'react';
import { UploadIcon } from './icons.tsx';

interface UploadZoneProps {
  onUpload: (files: File[]) => void;
  isProcessing: boolean;
}

const UploadZone: React.FC<UploadZoneProps> = ({ onUpload, isProcessing }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUpload(Array.from(e.dataTransfer.files));
      e.dataTransfer.clearData();
    }
  }, [onUpload]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(Array.from(e.target.files));
    }
  };

  return (
      <div
        className={`relative flex flex-col items-center justify-center w-full p-10 border-2 border-dashed rounded-lg transition-colors duration-300 ${
          isDragging ? 'border-primary bg-base' : 'border-gray-600 hover:border-gray-500'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.tiff"
          onChange={handleFileChange}
          disabled={isProcessing}
        />
        <div className="text-center p-4 pointer-events-none">
          <UploadIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-semibold text-text-light">
            Drag & drop documents here
          </p>
          <p className="mt-1 text-sm text-text-dark">
            or click to browse files
          </p>
          <p className="mt-4 text-xs text-gray-500">
            Supports: PDF, PNG, JPG, TIFF
          </p>
        </div>
      </div>
  );
};

export default UploadZone;