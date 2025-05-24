import React from 'react';
import { Topic } from '../types';

interface QueueManagerProps {
  queue: Topic[];
}

const getStatusClass = (status: Topic['status']): string => {
  switch (status) {
    case 'pending':
      return 'bg-gray-500 text-gray-100';
    case 'processing':
      return 'bg-yellow-500 text-yellow-900';
    case 'completed':
      return 'bg-green-500 text-green-900';
    case 'error':
      return 'bg-red-500 text-red-100';
    default:
      // Should not happen with current TopicStatus type, but good for robustness
      return 'bg-gray-600 text-gray-200';
  }
};

export const QueueManager: React.FC<QueueManagerProps> = ({ queue }) => {
  return (
    <div className="p-4 bg-gray-800 shadow-md rounded-lg">
      <h2 className="text-xl font-semibold text-indigo-400 mb-3">Processing Queue</h2>
      {queue.length === 0 ? (
        <p className="text-gray-400">No topics in the queue.</p>
      ) : (
        <ul className="space-y-2">
          {queue.map((topic) => (
            <li key={topic.id} className="p-3 bg-gray-700 rounded-md shadow">
              <div className="flex justify-between items-center">
                <span className="text-gray-100 font-medium">{topic.text}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block ml-2 ${getStatusClass(topic.status)}`}>
                  {topic.status}
                </span>
              </div>
              {topic.status === 'error' && topic.error && (
                <p className="mt-1 text-xs text-red-300">Error: {topic.error}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
