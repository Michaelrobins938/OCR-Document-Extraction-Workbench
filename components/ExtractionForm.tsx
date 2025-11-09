import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DocumentData, ExtractedField, ConfidenceLevel, DocType, FieldType, DocStatus } from '../types.ts';
import ConfidenceIndicator from './ConfidenceIndicator.tsx';
import { PencilIcon, CheckIcon, SparklesIcon } from './icons.tsx';
import BatchControls from './BatchControls.tsx';
import SmartAddFieldModal from './SmartAddFieldModal.tsx';

interface ExtractionFormProps {
  document: DocumentData | null;
  onUpdateField: (docId: string, fieldId: string, newValue: string, applyToAllWithSameLabel: boolean) => void;
  onUpdateDocType: (docId: string, newDocType: DocType) => void;
  onNext: () => void;
  onApprove: (docId: string) => void;
  onExport: (format: 'CSV' | 'JSON' | 'EXCEL') => void;
  onApproveBatch: () => void;
  hoveredFieldId: string | null;
  setHoveredFieldId: (id: string | null) => void;
  onSmartAddField: (fieldName: string) => Promise<void>;
  isAddingField: boolean;
}

// Define FIELD_MAPPINGS outside the component to prevent re-creation on every render
const FIELD_MAPPINGS: Record<DocType, { title: string; fields: string[] }> = {
    [DocType.INVOICE]: {
        title: 'Standard Invoice Fields',
        fields: ['Vendor', 'Invoice #', 'Date', 'Amount', 'PO #', 'Tax', 'Total']
    },
    [DocType.BOL]: {
        title: 'Standard Bill of Lading Fields',
        fields: ['Shipper', 'Consignee', 'Load #', 'Weight', 'Rate', 'Pickup Date', 'Delivery Date']
    },
    [DocType.RECEIPT]: {
        title: 'Standard Receipt Fields',
        fields: ['Vendor', 'Date', 'Amount', 'Category', 'Tax', 'Description']
    },
    [DocType.UNKNOWN]: {
        title: 'Unknown Document Type',
        fields: []
    }
};

// Utility functions for validation
const isValidDate = (value: string): boolean => {
    if (!value) return true; // Empty string is considered valid (not an error, but potentially empty)
    // Basic YYYY-MM-DD or MM/DD/YYYY format validation
    const dateRegex = /^\d{4}-\d{2}-\d{2}$|^\d{2}\/\d{2}\/\d{4}$/;
    if (!dateRegex.test(value)) return false;

    try {
        const date = new Date(value);
        return !isNaN(date.getTime());
    } catch (e) {
        return false;
    }
};

const isNumeric = (value: string): boolean => {
    if (!value) return true; // Empty string is considered valid
    return !isNaN(Number(value)) && isFinite(Number(value));
};

const validateValue = (value: string, fieldType: FieldType): string | null => {
    if (!value) return null; // No validation error for empty values, just a potentially missing value
    switch (fieldType) {
        case FieldType.DATE:
            return isValidDate(value) ? null : 'Invalid date format (e.g., YYYY-MM-DD or MM/DD/YYYY)';
        case FieldType.NUMBER:
            return isNumeric(value) ? null : 'Must be a number';
        default:
            return null;
    }
};

interface FieldRowProps {
  field: ExtractedField;
  onUpdate: (fieldId: string, newValue: string, applyToAllWithSameLabel: boolean) => void;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  documentFields: ExtractedField[]; // All fields for the current document
}

const FieldRow: React.FC<FieldRowProps> = ({ field, onUpdate, isHovered, onHover, documentFields }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(field.userCorrection ?? field.extractedValue);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [applyToAll, setApplyToAll] = useState(false);

  useEffect(() => {
    const currentValue = field.userCorrection ?? field.extractedValue;
    setValue(currentValue);
    setValidationError(validateValue(currentValue, field.fieldType));
  }, [field]);

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    setValidationError(validateValue(newValue, field.fieldType));
  };

  const handleSave = () => {
    // We allow saving even with validation errors, but the error message remains visible
    onUpdate(field.id, value, applyToAll);
    setIsEditing(false);
    setApplyToAll(false); // Reset applyToAll after saving
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      const currentValue = field.userCorrection ?? field.extractedValue;
      setValue(currentValue);
      setValidationError(validateValue(currentValue, field.fieldType));
      setApplyToAll(false);
    }
  };

  const isLowConfidence = field.confidenceLevel === ConfidenceLevel.LOW;
  const hasMultipleMatchingLabels = useMemo(() => {
    return documentFields.filter(f => f.label === field.label).length > 1;
  }, [documentFields, field.label]);

  return (
    <div 
      className={`p-3 grid grid-cols-12 gap-3 items-center border-b border-gray-700 transition-colors duration-200 ${isLowConfidence ? 'bg-danger/10' : ''} ${isHovered ? 'bg-primary/10' : ''} hover:bg-surface/50`}
      onMouseEnter={() => onHover(field.id)}
      onMouseLeave={() => onHover(null)}
    >
      <label htmlFor={`field-${field.id}`} className="col-span-3 text-sm text-text-dark font-medium">{field.label}</label>
      <div className="col-span-5 flex flex-col">
        {isEditing ? (
          <>
            <input
              id={`field-${field.id}`}
              type="text"
              value={value}
              onChange={handleValueChange}
              onKeyDown={handleKeyDown}
              onBlur={handleSave}
              autoFocus
              className={`w-full bg-base border ${validationError ? 'border-danger' : 'border-primary'} rounded-md px-2 py-1 text-text-light font-mono text-sm`}
              aria-invalid={!!validationError}
              aria-describedby={validationError ? `error-${field.id}` : undefined}
            />
            {validationError && (
              <p id={`error-${field.id}`} className="text-danger text-xs mt-1">{validationError}</p>
            )}
            {hasMultipleMatchingLabels && (
                <div className="flex items-center mt-2">
                    <input
                        type="checkbox"
                        id={`apply-to-all-${field.id}`}
                        checked={applyToAll}
                        onChange={(e) => setApplyToAll(e.target.checked)}
                        className="h-4 w-4 text-primary rounded border-gray-500 focus:ring-primary"
                        aria-label="Apply correction to all matching fields"
                    />
                    <label htmlFor={`apply-to-all-${field.id}`} className="ml-2 text-xs text-text-dark">
                        Apply to all matching fields
                    </label>
                </div>
            )}
          </>
        ) : (
          <p className={`font-mono text-sm ${validationError ? 'text-danger' : 'text-text-light'} truncate`}>
            {value}
            {validationError && <span className="ml-2 text-danger text-xs">(Error)</span>}
          </p>
        )}
      </div>
      <div className="col-span-3 flex justify-center">
        <ConfidenceIndicator level={field.confidenceLevel} score={field.confidence} />
      </div>
      <div className="col-span-1 flex justify-end">
        {isEditing ? (
           <button onClick={handleSave} className="text-success hover:text-green-300" aria-label={`Save ${field.label}`}>
            <CheckIcon className="h-5 w-5"/>
          </button>
        ) : (
          <button onClick={() => setIsEditing(true)} className="text-text-dark hover:text-primary" aria-label={`Edit ${field.label}`}>
            <PencilIcon className="h-5 w-5"/>
          </button>
        )}
      </div>
    </div>
  );
};


const ExtractionForm: React.FC<ExtractionFormProps> = ({ 
    document, 
    onUpdateField, 
    onUpdateDocType,
    onNext, 
    onApprove, 
    onExport, 
    onApproveBatch, 
    hoveredFieldId, 
    setHoveredFieldId, 
    onSmartAddField, 
    isAddingField 
}) => {
    const [isSmartAddModalOpen, setIsSmartAddModalOpen] = useState(false);

    const handleUpdate = useCallback((fieldId: string, newValue: string, applyToAllWithSameLabel: boolean) => {
        if (document) {
            onUpdateField(document.id, fieldId, newValue, applyToAllWithSameLabel);
        }
    }, [document, onUpdateField]);

    const handleDocTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (document) {
        onUpdateDocType(document.id, e.target.value as DocType);
      }
    };

    const handleSmartAddFieldSubmit = async (fieldName: string) => {
      if (document) {
          await onSmartAddField(fieldName);
          setIsSmartAddModalOpen(false);
      }
    };
    
  if (!document) {
    return (
      <div className="h-full bg-surface/50 flex items-center justify-center">
        <p className="text-text-dark">No document selected</p>
      </div>
    );
  }

  const fieldMappingInfo = FIELD_MAPPINGS[document.docType] || null;

  return (
    <div className="h-full bg-surface/50 flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <div className="flex justify-between items-center mb-2">
            <div>
                <h2 className="text-lg font-semibold text-text-light">Extracted Data</h2>
                <p className="text-sm text-text-dark">Review and correct fields as needed.</p>
            </div>
            <button
                onClick={() => setIsSmartAddModalOpen(true)}
                className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-primary/20 hover:bg-primary/40 text-primary rounded-md transition-colors"
                aria-label="Smart add a new field"
            >
                <SparklesIcon className="h-5 w-5" />
                <span>Smart Add</span>
            </button>
        </div>
        <div className="mt-4">
          <label htmlFor="doc-type-select" className="block text-sm font-medium text-gray-400 mb-1">
            Document Type
          </label>
          <select
            id="doc-type-select"
            value={document.docType}
            onChange={handleDocTypeChange}
            className="w-full bg-base border border-gray-600 rounded-md px-3 py-2 text-text-light text-sm"
            aria-label="Select document type"
          >
            {Object.values(DocType).map((type) => (
              <option key={type} value={type}>
                {type.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex-grow overflow-y-auto">
        {document.extractedFields.length === 0 && (
          <div className="p-4 text-text-dark text-sm">No fields extracted for this document.</div>
        )}
        {document.extractedFields.map(field => (
          <FieldRow 
            key={field.id} 
            field={field} 
            onUpdate={handleUpdate}
            isHovered={hoveredFieldId === field.id}
            onHover={setHoveredFieldId}
            documentFields={document.extractedFields}
          />
        ))}
      </div>
      
      <div className="flex-shrink-0 border-t border-gray-700">
        {fieldMappingInfo && fieldMappingInfo.fields.length > 0 && (
            <div className="p-4 text-xs text-text-dark border-b border-gray-700">
                <h4 className="font-semibold mb-2 text-text-light">{fieldMappingInfo.title}</h4>
                <div className="flex flex-wrap gap-2">
                    {fieldMappingInfo.fields.map(field => (
                        <span key={field} className="bg-base px-2 py-1 rounded-full text-gray-300 font-mono">
                            {field}
                        </span>
                    ))}
                </div>
            </div>
        )}
        <BatchControls 
          onApprove={() => onApprove(document.id)}
          onSaveNext={onNext}
          onApproveBatch={onApproveBatch}
          onExport={onExport}
          isApproved={document.status === DocStatus.APPROVED}
        />
      </div>
      <SmartAddFieldModal 
        isOpen={isSmartAddModalOpen}
        onClose={() => setIsSmartAddModalOpen(false)}
        onAddField={handleSmartAddFieldSubmit}
        isAdding={isAddingField}
      />
    </div>
  );
};

export default ExtractionForm;