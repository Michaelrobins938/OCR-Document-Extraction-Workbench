import React from 'react';
import UploadZone from './UploadZone.tsx';
import { BriefcaseIcon, ClockIcon, FileCheckIcon, ArrowRightIcon } from './icons.tsx';

interface LandingPageProps {
  onUpload: (files: File[]) => void;
  isProcessing: boolean;
}

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
  <div className="bg-surface/50 p-6 rounded-lg text-center">
    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/20 mx-auto mb-4">
      {icon}
    </div>
    <h3 className="text-lg font-semibold text-text-light mb-2">{title}</h3>
    <p className="text-sm text-text-dark">{description}</p>
  </div>
);


const LandingPage: React.FC<LandingPageProps> = ({ onUpload, isProcessing }) => {
  return (
    <div className="flex-grow bg-base overflow-y-auto">
      <div className="container mx-auto px-4 py-12 text-center max-w-5xl">
        <h2 className="text-4xl font-bold text-text-light mb-2">
          Transform Documents into Actionable Data
        </h2>
        <p className="text-lg text-text-dark mb-10">
          Start by uploading your invoices, bills of lading, and receipts to our AI-powered workbench.
        </p>

        <div className="bg-surface rounded-xl shadow-lg p-8 mb-12">
          <UploadZone onUpload={onUpload} isProcessing={isProcessing} />
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
                icon={<ClockIcon className="h-6 w-6 text-primary" />}
                title="Save Time"
                description="Eliminate hours of manual data entry per week. Let our AI do the heavy lifting."
            />
            <FeatureCard 
                icon={<FileCheckIcon className="h-6 w-6 text-primary" />}
                title="Improve Accuracy"
                description="Reduce human error with high-confidence data extraction and easy-to-use validation tools."
            />
             <FeatureCard 
                icon={<BriefcaseIcon className="h-6 w-6 text-primary" />}
                title="Streamline Workflow"
                description="Process documents in batches and export directly to CSV or your accounting software."
            />
        </div>

        <div className="mt-16 pt-8 border-t border-gray-700">
            <h3 className="text-2xl font-semibold text-text-light mb-6">A Simple, Powerful Workflow</h3>
            <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-8 text-text-dark">
                <div className="flex items-center space-x-2">
                    <span className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-white font-bold">1</span>
                    <span>Upload Documents</span>
                </div>
                <ArrowRightIcon className="h-6 w-6 hidden md:block" />
                 <div className="flex items-center space-x-2">
                    <span className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-white font-bold">2</span>
                    <span>Review & Correct</span>
                </div>
                 <ArrowRightIcon className="h-6 w-6 hidden md:block" />
                 <div className="flex items-center space-x-2">
                    <span className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-white font-bold">3</span>
                    <span>Approve & Export</span>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default LandingPage;