import { DocumentData, DocStatus, ExtractedField, ConfidenceLevel, DocType, FieldType, DocumentExtractionResponse, SingleFieldExtractionResponse } from '../types.ts';
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper function to convert file to a generative part
async function fileToGenerativePart(file: File) {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        resolve(result.split(',')[1]);
      } else {
        // Fallback for non-string results, though readAsDataURL usually yields a string
        resolve(''); 
      }
    };
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
}

// Map common field labels to their expected data types for validation
const FIELD_TYPE_MAP: Record<string, FieldType> = {
    'date': FieldType.DATE,
    'due date': FieldType.DATE,
    'pickup date': FieldType.DATE,
    'delivery date': FieldType.DATE,
    'amount': FieldType.NUMBER,
    'total': FieldType.NUMBER,
    'tax': FieldType.NUMBER,
    'rate': FieldType.NUMBER,
    'weight': FieldType.NUMBER,
    'invoice #': FieldType.TEXT, // Though numeric, it's often treated as a string with special chars
    'po #': FieldType.TEXT,
    'category': FieldType.TEXT,
    'description': FieldType.TEXT,
    'vendor': FieldType.TEXT,
    'shipper': FieldType.TEXT,
    'consignee': FieldType.TEXT,
    'load #': FieldType.TEXT,
};

const getFieldTypeFromLabel = (label: string): FieldType => {
  const lowerCaseLabel = label.toLowerCase();
  for (const key in FIELD_TYPE_MAP) {
    if (lowerCaseLabel.includes(key)) { // Use includes for more flexible matching
      return FIELD_TYPE_MAP[key];
    }
  }
  return FieldType.TEXT; // Default to text if no specific type is found
};


const responseSchema = {
    type: Type.OBJECT,
    properties: {
        docType: {
            type: Type.STRING,
            enum: ['INVOICE', 'BOL', 'RECEIPT', 'UNKNOWN'],
            description: 'The type of the document.'
        },
        extractedFields: {
            type: Type.ARRAY,
            description: 'The fields extracted from the document.',
            items: {
                type: Type.OBJECT,
                properties: {
                    fieldName: { type: Type.STRING, description: 'The machine-readable field name (e.g., invoiceNumber).' },
                    label: { type: Type.STRING, description: 'The human-readable label for the field (e.g., Invoice #).' },
                    extractedValue: { type: Type.STRING, description: 'The extracted value for the field.' },
                    confidence: { type: Type.NUMBER, description: 'A confidence score between 0.0 and 1.0.' },
                    boundingBox: {
                        type: Type.ARRAY,
                        description: 'Normalized vertices of the bounding polygon for the extracted value.',
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                x: { type: Type.NUMBER },
                                y: { type: Type.NUMBER },
                            },
                            required: ['x', 'y'],
                        }
                    }
                },
                required: ['fieldName', 'label', 'extractedValue', 'confidence'],
            },
        },
    },
    required: ['docType', 'extractedFields'],
};

export const extractDataFromDocument = async (file: File): Promise<DocumentData> => {
    try {
        const imagePart = await fileToGenerativePart(file);
        
        const prompt = `You are an expert OCR and document analysis engine.
        Analyze the provided document image. First, identify the document type from one of the following: INVOICE, BOL (Bill of Lading), RECEIPT. If you are unsure, classify it as UNKNOWN.
        Second, extract all relevant fields for that document type. For invoices, extract vendor, invoice number, date, amounts, etc. For BOLs, extract shipper, consignee, load numbers, etc. For receipts, get vendor, date, total, and line items.
        For each extracted field, provide a confidence score between 0.0 and 1.0, and the bounding polygon (normalized vertices) for the location of the extracted value in the image.
        
        Return the data in the specified JSON format.
        `;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: prompt }, imagePart] },
            config: {
                responseMimeType: 'application/json',
                responseSchema,
            },
        });
        
        const jsonResponse: DocumentExtractionResponse = JSON.parse(response.text);

        const fields: ExtractedField[] = jsonResponse.extractedFields.map((field, index: number): ExtractedField => {
            let confidenceLevel: ConfidenceLevel;
            if (field.confidence >= 0.95) {
                confidenceLevel = ConfidenceLevel.HIGH;
            } else if (field.confidence >= 0.85) {
                confidenceLevel = ConfidenceLevel.MEDIUM;
            } else {
                confidenceLevel = ConfidenceLevel.LOW;
            }
            return {
                id: `${field.fieldName}-${index}`,
                fieldName: field.fieldName,
                label: field.label,
                extractedValue: field.extractedValue,
                confidence: field.confidence,
                confidenceLevel,
                userCorrection: null,
                boundingBox: field.boundingBox,
                fieldType: getFieldTypeFromLabel(field.label), // Assign inferred field type
            };
        });

        const hasLowConfidence = fields.some(f => f.confidenceLevel === ConfidenceLevel.LOW);
        
        const doc: DocumentData = {
            id: `doc-${Date.now()}-${Math.random()}`,
            file,
            fileName: file.name,
            uploadedAt: new Date().toISOString(),
            status: hasLowConfidence ? DocStatus.REVIEW_NEEDED : DocStatus.EXTRACTED,
            imageUrl: URL.createObjectURL(file),
            docType: jsonResponse.docType as DocType || DocType.UNKNOWN,
            extractedFields: fields,
        };
        return doc;

    } catch (error) {
        console.error("Error extracting document data:", error);
        return {
            id: `doc-failed-${Date.now()}`,
            file,
            fileName: file.name,
            uploadedAt: new Date().toISOString(),
            status: DocStatus.FAILED,
            imageUrl: URL.createObjectURL(file),
            docType: DocType.UNKNOWN,
            extractedFields: [],
        };
    }
};

const singleFieldSchema = {
    type: Type.OBJECT,
    properties: {
        fieldName: { type: Type.STRING, description: 'The machine-readable field name (e.g., dueDate).' },
        label: { type: Type.STRING, description: 'The human-readable label for the field (e.g., Due Date).' },
        extractedValue: { type: Type.STRING, description: 'The extracted value for the field. If not found, return an empty string.' },
        confidence: { type: Type.NUMBER, description: 'A confidence score between 0.0 and 1.0. If not found, return 0.0.' },
        boundingBox: {
            type: Type.ARRAY,
            description: 'Normalized vertices of the bounding polygon for the extracted value. If not found, return an empty array.',
            items: {
                type: Type.OBJECT,
                properties: {
                    x: { type: Type.NUMBER },
                    y: { type: Type.NUMBER },
                },
                required: ['x', 'y'],
            }
        }
    },
    required: ['fieldName', 'label', 'extractedValue', 'confidence'],
};

export const extractSingleField = async (file: File, fieldNameToFind: string): Promise<ExtractedField | null> => {
    try {
        const imagePart = await fileToGenerativePart(file);
        
        const prompt = `You are an expert OCR and document analysis engine.
        Analyze the provided document image.
        Your task is to find and extract a single, specific field: "${fieldNameToFind}".
        
        - Find the value for "${fieldNameToFind}".
        - Provide a confidence score between 0.0 and 1.0 for your extraction.
        - Provide the bounding polygon (normalized vertices) for the location of the extracted value.
        - Create a machine-readable field name (camelCase) and a human-readable label for "${fieldNameToFind}".
        
        If you cannot find the field, return an empty string for the value, 0.0 for confidence, and an empty array for the bounding box.
        
        Return the data in the specified JSON format.
        `;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: prompt }, imagePart] },
            config: {
                responseMimeType: 'application/json',
                responseSchema: singleFieldSchema,
            },
        });
        
        const field: SingleFieldExtractionResponse = JSON.parse(response.text);

        if (!field || !field.extractedValue) {
            return null; // Field not found or empty
        }

        let confidenceLevel: ConfidenceLevel;
        if (field.confidence >= 0.95) {
            confidenceLevel = ConfidenceLevel.HIGH;
        } else if (field.confidence >= 0.85) {
            confidenceLevel = ConfidenceLevel.MEDIUM;
        } else {
            confidenceLevel = ConfidenceLevel.LOW;
        }

        const newField: ExtractedField = {
            id: `${field.fieldName}-${Date.now()}`,
            fieldName: field.fieldName,
            label: field.label,
            extractedValue: field.extractedValue,
            confidence: field.confidence,
            confidenceLevel,
            userCorrection: null,
            boundingBox: field.boundingBox,
            fieldType: getFieldTypeFromLabel(field.label), // Assign inferred field type
        };

        return newField;

    } catch (error) {
        console.error("Error extracting single field:", error);
        return null;
    }
};