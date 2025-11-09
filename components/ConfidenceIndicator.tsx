
import React from 'react';
import { ConfidenceLevel } from '../types.ts';
import { CheckIcon, WarningIcon, ErrorIcon, PencilIcon } from './icons.tsx';

interface ConfidenceIndicatorProps {
  level: ConfidenceLevel;
  score: number;
}

const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({ level, score }) => {
  const config = {
    [ConfidenceLevel.HIGH]: {
      bgColor: 'bg-success/20',
      textColor: 'text-success',
      icon: <CheckIcon className="h-4 w-4" />,
      text: 'High',
    },
    [ConfidenceLevel.MEDIUM]: {
      bgColor: 'bg-warning/20',
      textColor: 'text-warning',
      icon: <WarningIcon className="h-4 w-4" />,
      text: 'Medium',
    },
    [ConfidenceLevel.LOW]: {
      bgColor: 'bg-danger/20',
      textColor: 'text-danger',
      icon: <ErrorIcon className="h-4 w-4" />,
      text: 'Low',
    },
    [ConfidenceLevel.MANUAL]: {
      bgColor: 'bg-primary/20',
      textColor: 'text-primary',
      icon: <PencilIcon className="h-4 w-4" />,
      text: 'Manual',
    },
  };

  const { bgColor, textColor, icon } = config[level];
  const percentage = level === ConfidenceLevel.MANUAL ? '100%' : `${Math.round(score * 100)}%`;

  return (
    <div className={`flex items-center space-x-2 px-2 py-1 rounded-md text-xs font-mono ${bgColor} ${textColor}`}>
      {icon}
      <span>{percentage}</span>
    </div>
  );
};

export default ConfidenceIndicator;