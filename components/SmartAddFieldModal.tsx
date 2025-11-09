import React, { useState } from 'react';
import { XIcon, SparklesIcon } from './icons.tsx';

interface SmartAddFieldModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddField: (fieldName: string) => void;
    isAdding: boolean;
}

const SmartAddFieldModal: React.FC<SmartAddFieldModalProps> = ({ isOpen, onClose, onAddField, isAdding }) => {
    const [fieldName, setFieldName] = useState('');

    if (!isOpen) {
        return null;
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (fieldName.trim() && !isAdding) {
            onAddField(fieldName.trim());
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-surface rounded-lg shadow-xl w-full max-w-md p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-text-light">Smart Add Field</h2>
                    <button onClick={onClose} className="text-text-dark hover:text-text-light">
                        <span className="sr-only">Close</span>
                        <XIcon className="h-6 w-6" />
                    </button>
                </div>
                <p className="text-sm text-text-dark mb-6">
                    Enter the name of the field you want the AI to find in the document (e.g., "Due Date", "Shipping Method").
                </p>
                <form onSubmit={handleSubmit}>
                    <label htmlFor="fieldName" className="block text-sm font-medium text-gray-400 mb-2">
                        Field Name
                    </label>
                    <input 
                        id="fieldName"
                        type="text"
                        value={fieldName}
                        onChange={(e) => setFieldName(e.target.value)}
                        placeholder="e.g., Due Date"
                        className="w-full bg-base border border-gray-600 focus:border-primary focus:ring-primary rounded-md px-3 py-2 text-text-light font-sans text-sm"
                        autoFocus
                    />
                    <div className="mt-6 flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-semibold text-text-light bg-gray-600 rounded-md hover:bg-gray-500 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!fieldName.trim() || isAdding}
                            className="flex items-center justify-center min-w-[150px] px-4 py-2 text-sm font-semibold text-white bg-primary rounded-md hover:bg-blue-500 transition-colors disabled:bg-primary/50 disabled:cursor-not-allowed"
                        >
                            {isAdding ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Searching...</span>
                                </>
                            ) : (
                                <>
                                    <SparklesIcon className="h-5 w-5 mr-2" />
                                    <span>Find & Add Field</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SmartAddFieldModal;