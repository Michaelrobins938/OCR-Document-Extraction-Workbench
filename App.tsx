import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import LandingPage from './components/LandingPage.tsx';
import DocumentQueue from './components/DocumentQueue.tsx';
import DocumentViewer from './components/DocumentViewer.tsx';
import ExtractionForm from './components/ExtractionForm.tsx';
import Toast from './components/Toast.tsx';
import { DocumentData, DocStatus, ConfidenceLevel, DocType, ExportFormat, ExtractedField } from './types.ts';
import { extractDataFromDocument, extractSingleField } from './services/ocrService.ts';

type AppState = 'uploading' | 'workbench';
type ToastState = { message: string; type: 'success' | 'warning' | 'danger' | 'info' };

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('uploading');
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<DocType | 'all'>('all');
  const [toast, setToast] = useState<ToastState | null>(null);
  const [hoveredFieldId, setHoveredFieldId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAddingField, setIsAddingField] = useState(false);

  const docTypesInQueue = useMemo(() => 
    [...new Set(documents.map(d => d.docType).filter(t => t && t !== DocType.UNKNOWN))]
    .sort(), [documents]);

  const docCounts = useMemo(() => {
    const counts: Record<string, number> = { all: documents.length };
    docTypesInQueue.forEach(type => {
      counts[type] = documents.filter(d => d.docType === type).length;
    });
    return counts;
  }, [documents, docTypesInQueue]);

  const filteredDocuments = useMemo(() => {
      if (activeFilter === 'all') return documents;
      return documents.filter(doc => doc.docType === activeFilter);
  }, [documents, activeFilter]);

  const handleUpload = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    
    setIsProcessing(true);
    setAppState('workbench');

    const newDocs: DocumentData[] = files.map(file => ({
        id: `doc-placeholder-${Date.now()}-${Math.random()}`,
        file,
        fileName: file.name,
        uploadedAt: new Date().toISOString(),
        status: DocStatus.PROCESSING,
        imageUrl: '',
        docType: DocType.UNKNOWN,
        extractedFields: [],
    }));

    setDocuments(prev => [...prev, ...newDocs]);
    if (!selectedDocId && newDocs.length > 0) { // Ensure newDocs is not empty
      setSelectedDocId(newDocs[0].id);
    }
    
    for (const doc of newDocs) {
        const processedDoc = await extractDataFromDocument(doc.file);
        setDocuments(prevDocs => 
            prevDocs.map(d => d.id === doc.id ? {...processedDoc, id: doc.id} : d)
        );
         if (selectedDocId === doc.id) {
           setSelectedDocId(doc.id); // re-select to refresh view if needed
        }
    }
    setIsProcessing(false);
  }, [selectedDocId]);

  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };
  
  const handleMoreFilesSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      handleUpload(Array.from(event.target.files));
      event.target.value = ''; // Reset for re-uploading same file
    }
  };


  useEffect(() => {
    if (documents.length > 0 && !selectedDocId) {
      const firstVisibleDoc = filteredDocuments[0];
      if (firstVisibleDoc) {
          setSelectedDocId(firstVisibleDoc.id);
      }
    }
  }, [documents, selectedDocId, filteredDocuments]);

  const handleSelectDoc = (id: string) => {
    setSelectedDocId(id);
  };

  const handleUpdateField = useCallback((docId: string, fieldId: string, newValue: string, applyToAllWithSameLabel: boolean) => {
    setDocuments(prevDocs =>
      prevDocs.map(doc => {
        if (doc.id === docId) {
          let updatedFields: ExtractedField[];
          if (applyToAllWithSameLabel) {
            const targetFieldLabel = doc.extractedFields.find(f => f.id === fieldId)?.label;
            updatedFields = doc.extractedFields.map(field => {
              if (field.label === targetFieldLabel) {
                return { 
                    ...field, 
                    userCorrection: newValue,
                    confidenceLevel: ConfidenceLevel.MANUAL,
                    confidence: 1.0,
                };
              }
              return field;
            });
          } else {
            updatedFields = doc.extractedFields.map(field => {
              if (field.id === fieldId) {
                return { 
                  ...field, 
                  userCorrection: newValue,
                  confidenceLevel: ConfidenceLevel.MANUAL,
                  confidence: 1.0,
                };
              }
              return field;
            });
          }
          // Check if any fields still require review
          const requiresReview = updatedFields.some(f => f.confidenceLevel === ConfidenceLevel.LOW && !f.userCorrection);
          const newStatus = requiresReview ? DocStatus.REVIEW_NEEDED : DocStatus.EXTRACTED;

          return { ...doc, extractedFields: updatedFields, status: newStatus };
        }
        return doc;
      })
    );
  }, []);

  const handleUpdateDocType = useCallback((docId: string, newDocType: DocType) => {
    setDocuments(prevDocs => 
      prevDocs.map(doc => 
        doc.id === docId ? { ...doc, docType: newDocType } : doc
      )
    );
  }, []);

  const handleNext = () => {
    const currentIndex = filteredDocuments.findIndex(d => d.id === selectedDocId);
    if (currentIndex > -1 && currentIndex < filteredDocuments.length - 1) {
      setSelectedDocId(filteredDocuments[currentIndex + 1].id);
    } else if (currentIndex === filteredDocuments.length - 1) {
      // Optionally loop back to the start or show a message
      setToast({ message: "You've reached the end of the filtered documents.", type: 'info' });
    }
  };

  const handleApprove = (docId: string) => {
    setDocuments(prev => prev.map(doc => doc.id === docId ? {...doc, status: DocStatus.APPROVED} : doc));
  };

  const handleApproveBatch = () => {
    setDocuments(prev => prev.map(doc => 
        (doc.status === DocStatus.EXTRACTED || doc.status === DocStatus.REVIEW_NEEDED) 
            ? {...doc, status: DocStatus.APPROVED} 
            : doc
    ));
    setToast({ message: "Batch approved successfully!", type: 'success' });
  };
  
  const handleExport = (format: ExportFormat) => {
    const approvedDocs = documents.filter(d => d.status === DocStatus.APPROVED);
    if(approvedDocs.length === 0) {
        setToast({ message: "No approved documents to export.", type: 'warning' });
        return;
    }

    if (format === ExportFormat.CSV) {
        // Collect all unique headers from all approved documents
        const allLabels = Array.from(new Set(approvedDocs.flatMap(doc => doc.extractedFields.map(f => f.label))));
        const headers: string[] = ['fileName', 'docType', ...allLabels]; // Explicitly type headers as string[]

        const rows = approvedDocs.map(doc => {
            const values: string[] = [doc.fileName, doc.docType]; // Explicitly type values as string[]
            const fieldMap = new Map(doc.extractedFields.map(f => [f.label, f.userCorrection ?? f.extractedValue]));
            
            allLabels.forEach(label => { 
                const value = fieldMap.get(label) || '';
                // Enclose in double quotes and escape internal double quotes for CSV
                values.push(`"${value.replace(/"/g, '""')}"`);
            });
            return values.join(',');
        });

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
        const encodedUri = encodeURIComponent(csvContent); // Use encodeURIComponent for robustness
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `export_${new Date().toISOString()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setToast({ message: "CSV export complete!", type: 'success' });
    } else if (format === ExportFormat.JSON) {
        const jsonContent = JSON.stringify(approvedDocs.map(doc => ({
            id: doc.id,
            fileName: doc.fileName,
            docType: doc.docType,
            uploadedAt: doc.uploadedAt,
            status: doc.status,
            extractedData: Object.fromEntries(
                doc.extractedFields.map(field => [field.fieldName, field.userCorrection ?? field.extractedValue])
            )
        })), null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `export_${new Date().toISOString()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setToast({ message: "JSON export complete!", type: 'success' });
    } else if (format === ExportFormat.EXCEL) {
        setToast({ message: "Excel export is not yet implemented. This is a mock response, as full Excel generation requires a server-side process or dedicated client-side library.", type: 'warning' });
    }
  };
  
  const handleSmartAddField = useCallback(async (fieldName: string) => {
    if (!selectedDocId) {
        setToast({ message: "No document selected.", type: 'warning' });
        return;
    }

    const currentDoc = documents.find(d => d.id === selectedDocId);
    if (!currentDoc) return;

    setIsAddingField(true);
    try {
        const newField = await extractSingleField(currentDoc.file, fieldName);
        
        if (newField) {
            let fieldExists = false;
            setDocuments(prevDocs => prevDocs.map(doc => {
                if (doc.id === selectedDocId) {
                    if (doc.extractedFields.some(f => f.label.toLowerCase() === newField.label.toLowerCase())) {
                        fieldExists = true;
                        return doc;
                    }
                    return {
                        ...doc,
                        extractedFields: [...doc.extractedFields, newField],
                    };
                }
                return doc;
            }));

            if (fieldExists) {
                setToast({ message: `Field "${newField.label}" already exists in this document.`, type: 'warning' });
            } else {
                setToast({ message: `Successfully added field: ${newField.label}`, type: 'success' });
            }
        } else {
            setToast({ message: `Could not find field "${fieldName}" in the document.`, type: 'danger' });
        }
    } catch (error) {
        console.error("Error in handleSmartAddField:", error);
        setToast({ message: "An error occurred while adding the field. Please check console for details.", type: 'danger' });
    } finally {
        setIsAddingField(false);
    }
  }, [selectedDocId, documents]);

  
  const totalDocs = documents.length;
  const processedDocs = documents.filter(d => d.status !== DocStatus.PROCESSING).length;
  const progress = totalDocs > 0 ? (processedDocs / totalDocs) * 100 : 0;
  
  const selectedDocument = documents.find(d => d.id === selectedDocId) || null;

  useEffect(() => {
    // If the selected document is filtered out, select the first one in the new list
    if (selectedDocId && !filteredDocuments.some(d => d.id === selectedDocId)) {
      setSelectedDocId(filteredDocuments.length > 0 ? filteredDocuments[0].id : null);
    }
  }, [filteredDocuments, selectedDocId]);


  return (
    <div className="h-screen w-screen bg-base flex flex-col antialiased">
       {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
       <input
        type="file"
        ref={fileInputRef}
        onChange={handleMoreFilesSelected}
        className="hidden"
        multiple
        accept=".pdf,.png,.jpg,.jpeg,.tiff"
      />
      <header className="p-4 bg-surface text-center shadow-md z-10 flex-shrink-0">
        <h1 className="text-xl font-bold text-text-light">OCR Document Extraction Workbench</h1>
      </header>
      
      {appState === 'uploading' ? (
        <main className="flex-grow">
          <LandingPage onUpload={handleUpload} isProcessing={isProcessing} />
        </main>
      ) : (
        <main className="flex-grow grid grid-cols-10 h-[calc(100vh-68px)]">
          <aside className="col-span-2 bg-surface flex flex-col">
            <DocumentQueue 
              documents={filteredDocuments} 
              selectedDocId={selectedDocId} 
              onSelectDoc={handleSelectDoc}
              onUploadMore={handleTriggerUpload}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              availableDocTypes={docTypesInQueue}
              docCounts={docCounts}
            />
          </aside>
          <section className="col-span-5 bg-base">
            <DocumentViewer 
                document={selectedDocument} 
                hoveredFieldId={hoveredFieldId}
                setHoveredFieldId={setHoveredFieldId}
            />
          </section>
          <aside className="col-span-3 bg-surface">
            <ExtractionForm 
              document={selectedDocument} 
              onUpdateField={handleUpdateField} 
              onUpdateDocType={handleUpdateDocType}
              onNext={handleNext}
              onApprove={handleApprove}
              onExport={handleExport}
              onApproveBatch={handleApproveBatch}
              hoveredFieldId={hoveredFieldId}
              setHoveredFieldId={setHoveredFieldId}
              onSmartAddField={handleSmartAddField}
              isAddingField={isAddingField}
            />
          </aside>
        </main>
      )}
      {isProcessing && (
        <div className="fixed bottom-0 left-0 right-0 p-2 bg-primary text-white text-center text-sm z-20">
            <p>Processing {totalDocs - processedDocs} of {totalDocs} documents...</p>
            <div className="w-full bg-blue-200 rounded-full h-1.5 mt-1">
                <div className="bg-white h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;