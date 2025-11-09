import React from 'react';
import { DocumentData, DocStatus, DocType } from '../types.ts';
import { FileIcon, PlusIcon } from './icons.tsx';

interface DocumentQueueProps {
  documents: DocumentData[];
  selectedDocId: string | null;
  onSelectDoc: (id: string) => void;
  onUploadMore: () => void;
  activeFilter: DocType | 'all';
  onFilterChange: (filter: DocType | 'all') => void;
  availableDocTypes: DocType[];
  docCounts: Record<string, number>;
}

const StatusBadge: React.FC<{ status: DocStatus }> = ({ status }) => {
  const statusStyles: Record<DocStatus, string> = {
    [DocStatus.PROCESSING]: 'bg-blue-500/20 text-blue-400',
    [DocStatus.EXTRACTED]: 'bg-gray-500/20 text-gray-400',
    [DocStatus.REVIEW_NEEDED]: 'bg-warning/20 text-warning',
    [DocStatus.APPROVED]: 'bg-success/20 text-success',
    [DocStatus.FAILED]: 'bg-danger/20 text-danger',
  };
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusStyles[status]}`}>
      {status}
    </span>
  );
};

const TypeBadge: React.FC<{ type: DocType }> = ({ type }) => {
  if (type === DocType.UNKNOWN) return null;
  return (
    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-surface text-text-dark capitalize">
      {type.toLowerCase()}
    </span>
  );
};


const DocumentQueue: React.FC<DocumentQueueProps> = ({ 
    documents, 
    selectedDocId, 
    onSelectDoc, 
    onUploadMore,
    activeFilter,
    onFilterChange,
    availableDocTypes,
    docCounts,
}) => {
    
    const groupedDocuments = documents.reduce((acc, doc) => {
        const type = doc.docType || DocType.UNKNOWN;
        if (!acc[type]) {
            acc[type] = [];
        }
        acc[type].push(doc);
        return acc;
    }, {} as Record<string, DocumentData[]>);

    const groupOrder = [DocType.INVOICE, DocType.BOL, DocType.RECEIPT, DocType.UNKNOWN];

    return (
        <div className="h-full bg-surface/50 flex flex-col">
            <div className="p-4 border-b border-gray-700">
                 <div className="flex justify-between items-center mb-2">
                    <h2 className="text-lg font-semibold text-text-light">Document Queue</h2>
                    <button 
                        onClick={onUploadMore}
                        className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-primary hover:bg-blue-500 rounded-md transition-colors"
                        aria-label="Upload more documents"
                    >
                        <PlusIcon className="h-4 w-4" />
                        <span>Upload</span>
                    </button>
                </div>
                <p className="text-sm text-text-dark">{docCounts['all'] || 0} total documents</p>

                <div className="mt-4">
                    <p className="text-xs font-semibold text-gray-400 mb-2">FILTER BY TYPE</p>
                    <div className="flex items-center space-x-1 overflow-x-auto">
                        <button onClick={() => onFilterChange('all')} className={`flex items-center space-x-2 flex-shrink-0 px-3 py-1 text-sm rounded-md transition ${activeFilter === 'all' ? 'bg-primary text-white' : 'bg-surface hover:bg-gray-600'}`}>
                            <span>All</span>
                            <span className="bg-base/50 text-xs px-1.5 rounded-full">{docCounts['all'] || 0}</span>
                        </button>
                        {availableDocTypes.map(type => (
                            <button key={type} onClick={() => onFilterChange(type)} className={`flex items-center space-x-2 flex-shrink-0 px-3 py-1 text-sm rounded-md transition capitalize ${activeFilter === type ? 'bg-primary text-white' : 'bg-surface hover:bg-gray-600'}`}>
                                <span>{type.toLowerCase()}</span>
                                <span className="bg-base/50 text-xs px-1.5 rounded-full">{docCounts[type] || 0}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <div className="flex-grow overflow-y-auto">
                {groupOrder.map(group => {
                    const docsInGroup = groupedDocuments[group];
                    if (!docsInGroup || docsInGroup.length === 0) {
                        return null;
                    }
                    return (
                        <div key={group}>
                            <h3 className="px-4 py-2 text-sm font-semibold text-text-dark bg-base/50 sticky top-0 z-10">{group} ({docsInGroup.length})</h3>
                            <ul>
                                {docsInGroup.map((doc) => (
                                    <li key={doc.id}>
                                        <button
                                            onClick={() => onSelectDoc(doc.id)}
                                            className={`w-full text-left p-4 border-l-4 transition-colors duration-200 ${
                                                selectedDocId === doc.id
                                                    ? 'bg-primary/20 border-primary'
                                                    : 'border-transparent hover:bg-surface'
                                            }`}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <FileIcon className="h-6 w-6 text-text-dark flex-shrink-0"/>
                                                <div className="flex-grow overflow-hidden">
                                                    <p className="text-sm font-medium text-text-light truncate">{doc.fileName}</p>
                                                    <div className="mt-1 flex items-center flex-wrap gap-1">
                                                        <StatusBadge status={doc.status} />
                                                        <TypeBadge type={doc.docType} />
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};

export default DocumentQueue;