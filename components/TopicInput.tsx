import React from 'react';

interface TopicInputProps {
  topics: string;
  onTopicsChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  disabled: boolean;
}

export const TopicInput: React.FC<TopicInputProps> = ({
  topics,
  onTopicsChange,
  onSubmit,
  isLoading,
  disabled,
}) => {
  const isSubmitDisabled = isLoading || disabled || !topics.trim();

  return (
    <div className="p-4 bg-gray-800 shadow-md rounded-lg">
      <label
        htmlFor="topic-input-area"
        className="block text-sm font-medium text-indigo-300 mb-1"
      >
        Enter Topics (one per line):
      </label>
      <textarea
        id="topic-input-area"
        value={topics}
        onChange={(e) => onTopicsChange(e.target.value)}
        placeholder="e.g., The history of AI
Quantum computing basics"
        disabled={disabled}
        className="w-full h-32 p-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        rows={4}
      />
      <button
        onClick={onSubmit}
        disabled={isSubmitDisabled}
        className="mt-3 w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-500 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Processing...' : 'Add Topics to Queue'}
      </button>
    </div>
  );
};
