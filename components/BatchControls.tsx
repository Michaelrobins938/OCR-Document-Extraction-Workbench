import React, { useState } from 'react';
import { ExportFormat } from '../types.ts';

interface BatchControlsProps {
    onSaveNext: () => void;
    onApprove: () => void;
    onExport: (format: ExportFormat) => void;
    onApproveBatch: () => void;
    isApproved: boolean;
}

const BatchControls: React.FC<BatchControlsProps> = ({ onSaveNext, onApprove, onExport, onApproveBatch, isApproved }) => {
    const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);

    const handleExportClick = (format: ExportFormat) => {
        onExport(format);
        setIsExportDropdownOpen(false);
    };

    return (
        <div className="p-4 bg-surface flex-shrink-0">
            <div className="flex items-center justify-between space-x-2">
                <div className="flex space-x-2">
                    <div className="relative">
                        <button
                            onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                            className="px-4 py-2 text-sm font-semibold text-white bg-gray-600 rounded-md hover:bg-gray-500 transition-colors relative"
                            aria-expanded={isExportDropdownOpen}
                            aria-haspopup="true"
                        >
                            Export ▾
                        </button>
                        {isExportDropdownOpen && (
                            <div className="absolute bottom-full left-0 mb-2 w-40 bg-surface rounded-md shadow-lg z-20" role="menu" aria-orientation="vertical">
                                <ul className="py-1">
                                    <li>
                                        <button
                                            onClick={() => handleExportClick(ExportFormat.CSV)}
                                            className="block w-full text-left px-4 py-2 text-sm text-text-light hover:bg-gray-700"
                                            role="menuitem"
                                        >
                                            Export as CSV
                                        </button>
                                    </li>
                                    <li>
                                        <button
                                            onClick={() => handleExportClick(ExportFormat.JSON)}
                                            className="block w-full text-left px-4 py-2 text-sm text-text-light hover:bg-gray-700"
                                            role="menuitem"
                                        >
                                            Export as JSON
                                        </button>
                                    </li>
                                    <li>
                                        <button
                                            onClick={() => handleExportClick(ExportFormat.EXCEL)}
                                            className="block w-full text-left px-4 py-2 text-sm text-text-light hover:bg-gray-700"
                                            role="menuitem"
                                        >
                                            Export as Excel (Mock)
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={onApproveBatch}
                        className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-500 transition-colors"
                        aria-label="Approve all extracted or review-needed documents"
                    >
                        Approve Batch
                    </button>
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={onApprove}
                        disabled={isApproved}
                        className={`px-4 py-2 text-sm font-semibold text-white rounded-md transition-colors ${
                            isApproved 
                                ? 'bg-success/50 cursor-not-allowed' 
                                : 'bg-success hover:bg-green-500'
                        }`}
                        aria-label={isApproved ? 'Document approved' : 'Approve current document'}
                    >
                        {isApproved ? 'Approved' : 'Approve'}
                    </button>
                    <button
                        onClick={onSaveNext}
                        className="px-4 py-2 text-sm font-semibold text-white bg-primary rounded-md hover:bg-blue-500 transition-colors"
                        aria-label="Save current document and go to next"
                    >
                        Save & Next
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BatchControls;