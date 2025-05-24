import React from 'react';
import { VideoDuration } from '../types'; // SpeechSynthesisVoice is a global browser type

interface ControlsProps {
  availableVoices: SpeechSynthesisVoice[];
  selectedVoiceName: string | null;
  onVoiceChange: (name: string) => void;
  videoDuration: VideoDuration;
  onDurationChange: (duration: VideoDuration) => void;
  disabled: boolean;
}

export const Controls: React.FC<ControlsProps> = ({
  availableVoices,
  selectedVoiceName,
  onVoiceChange,
  videoDuration,
  onDurationChange,
  disabled,
}) => {
  const getDurationText = (durationValue: VideoDuration): string => {
    switch (durationValue) {
      case VideoDuration.THIRTY_SECONDS:
        return "30 Seconds";
      case VideoDuration.SIXTY_SECONDS:
        return "60 Seconds";
      default:
        // Fallback for any other future values, though not expected with current enum
        const valueStr = String(durationValue);
        return valueStr.endsWith('s') ? valueStr.slice(0, -1) + " Seconds" : valueStr + " Seconds";
    }
  };

  return (
    <div className="p-4 bg-gray-800 shadow-md rounded-lg space-y-4">
      <div>
        <label htmlFor="voice-select" className="block text-sm font-medium text-indigo-300 mb-1">
          Select Voice:
        </label>
        <select
          id="voice-select"
          value={selectedVoiceName || ''}
          onChange={(e) => onVoiceChange(e.target.value)}
          disabled={disabled || availableVoices.length === 0}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          {availableVoices.length === 0 && !disabled && (
            <option value="">Loading voices...</option>
          )}
          {availableVoices.length === 0 && disabled && (
             <option value="">No voices available</option>
          )}
          {availableVoices.map((voice) => (
            <option key={voice.name} value={voice.name}>
              {`${voice.name} (${voice.lang})`}
            </option>
          ))}
        </select>
      </div>

      <fieldset className="border border-gray-700 p-3 rounded-md">
        <legend className="text-sm font-medium text-indigo-300 px-1">Video Duration:</legend>
        <div className="mt-2 flex gap-4"> {/* Horizontal layout for radio buttons */}
          {Object.values(VideoDuration).map((durationValue) => (
            <label key={durationValue} className="inline-flex items-center text-sm text-gray-300 cursor-pointer">
              <input
                type="radio"
                name="video-duration"
                value={durationValue}
                checked={videoDuration === durationValue}
                onChange={() => onDurationChange(durationValue)}
                disabled={disabled}
                className="h-4 w-4 text-indigo-600 bg-gray-700 border-gray-600 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:text-gray-500"
              />
              <span className="ml-2">{getDurationText(durationValue)}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
};
