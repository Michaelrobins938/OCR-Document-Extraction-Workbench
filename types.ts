export enum DocType {
    INVOICE = 'INVOICE',
    BOL = 'BOL',
    RECEIPT = 'RECEIPT',
    UNKNOWN = 'UNKNOWN'
}

export enum DocStatus {
  PROCESSING = 'Processing',
  EXTRACTED = 'Extracted',
  REVIEW_NEEDED = 'Review Needed',
  APPROVED = 'Approved',
  FAILED = 'Failed',
}

export enum ConfidenceLevel {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  MANUAL = 'manual'
}

export enum FieldType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  DATE = 'DATE',
}

export interface ExtractedField {
  id: string;
  fieldName: string;
  label: string;
  extractedValue: string;
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  userCorrection: string | null;
  boundingBox?: { x: number; y: number }[];
  fieldType: FieldType; // Added for validation
}

export interface DocumentData {
  id: string;
  file: File;
  fileName: string;
  uploadedAt: string;
  status: DocStatus;
  imageUrl: string;
  docType: DocType;
  extractedFields: ExtractedField[];
}

export enum ExportFormat {
  CSV = 'CSV',
  JSON = 'JSON',
  EXCEL = 'EXCEL', // Mocked
}

// Interface for the overall document extraction response structure from the API
export interface DocumentExtractionResponse {
  docType: DocType;
  extractedFields: Array<{
    fieldName: string;
    label: string;
    extractedValue: string;
    confidence: number;
    boundingBox?: { x: number; y: number }[];
  }>;
}

// Interface for the single field extraction response structure from the API
export interface SingleFieldExtractionResponse {
  fieldName: string;
  label: string;
  extractedValue: string;
  confidence: number;
  boundingBox?: { x: number; y: number }[];
}