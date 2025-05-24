import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GeneratedVideo, ScriptSegment, VisualIdea } from '../types';
import { MAX_VISUALS_TO_DISPLAY } from '../constants'; // Though not directly used for limiting display count here

interface VideoPreviewProps {
  video: GeneratedVideo | null;
  selectedVoice: SpeechSynthesisVoice | null;
  onPlaybackComplete: () => void;
  apiKeyAvailable: boolean;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({
  video,
  selectedVoice,
  onPlaybackComplete,
  apiKeyAvailable,
}) => {
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [currentVisualIndex, setCurrentVisualIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackStatus, setPlaybackStatus] = useState<'idle' | 'playing' | 'paused' | 'ended'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const speechSynthesisRef = useRef(window.speechSynthesis);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  // segmentTimeoutRef is not strictly needed if advancing segment-by-segment via onend
  // but if visuals were to advance on a separate timer, it would be.
  // For now, direct advancement in onend is cleaner.

  const handleStop = useCallback(() => {
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
    }
    if (utteranceRef.current) {
      utteranceRef.current.onend = null;
      utteranceRef.current.onerror = null;
      utteranceRef.current = null;
    }
    setIsPlaying(false);
    setPlaybackStatus('idle');
    setCurrentSegmentIndex(0);
    // currentVisualIndex will be reset by useEffect on video or currentSegmentIndex change
    setErrorMessage(null);
  }, []);

  const speakSegment = useCallback((segmentIndex: number) => {
    if (!video || !video.scriptSegments[segmentIndex] || !speechSynthesisRef.current) {
      handleStop(); // Stop if something is wrong
      return;
    }

    if (speechSynthesisRef.current.speaking) {
      speechSynthesisRef.current.cancel(); // Stop any current speech
    }

    const segment = video.scriptSegments[segmentIndex];
    const newUtterance = new SpeechSynthesisUtterance(segment.text);
    utteranceRef.current = newUtterance;

    if (selectedVoice) {
      newUtterance.voice = selectedVoice;
    }

    newUtterance.onend = () => {
      if (segmentIndex >= video.scriptSegments.length - 1) {
        setIsPlaying(false);
        setPlaybackStatus('ended');
        onPlaybackComplete();
        // Optionally reset to beginning: setCurrentSegmentIndex(0); 
        // Or leave at end, handleStop will reset.
      } else {
        setCurrentSegmentIndex(prevIndex => prevIndex + 1);
        // speakSegment for next segment will be triggered by useEffect watching currentSegmentIndex & isPlaying
      }
    };

    newUtterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
      setErrorMessage(`TTS Error: ${event.error}`);
      setIsPlaying(false);
      setPlaybackStatus('idle'); // Or 'error' if we add that status
      // Consider stopping altogether or allowing user to retry
    };
    
    setPlaybackStatus('playing');
    setIsPlaying(true);
    setErrorMessage(null);
    speechSynthesisRef.current.speak(newUtterance);
  }, [video, selectedVoice, onPlaybackComplete, handleStop]);

  const handlePlayPause = useCallback(() => {
    if (!video || video.scriptSegments.length === 0) return;

    if (isPlaying) { // Currently playing, so pause
      if (speechSynthesisRef.current) {
        speechSynthesisRef.current.pause();
      }
      setIsPlaying(false);
      setPlaybackStatus('paused');
    } else { // Currently paused or stopped/idle
      if (playbackStatus === 'paused' && speechSynthesisRef.current) {
        speechSynthesisRef.current.resume();
        setIsPlaying(true);
        setPlaybackStatus('playing');
      } else { // Was 'idle' or 'ended', start from currentSegmentIndex (or 0 if ended)
        let segmentToPlay = currentSegmentIndex;
        if (playbackStatus === 'ended' || segmentToPlay >= video.scriptSegments.length) {
          segmentToPlay = 0;
          setCurrentSegmentIndex(0);
        }
        speakSegment(segmentToPlay);
      }
    }
  }, [isPlaying, playbackStatus, video, currentSegmentIndex, speakSegment]);
  
  // Effect for video changes: Reset everything
  useEffect(() => {
    handleStop();
    setCurrentSegmentIndex(0);
    setCurrentVisualIndex(0); // Reset visual as well
  }, [video, handleStop]); // handleStop is memoized

  // Effect to start speaking when currentSegmentIndex changes while in 'playing' state
  // This is the primary mechanism for advancing through segments after the initial 'play'
  useEffect(() => {
    if (isPlaying && playbackStatus === 'playing' && video && currentSegmentIndex < video.scriptSegments.length) {
      // This condition prevents re-speaking if only isPlaying changed (e.g. due to a quick pause/resume not caught by handlePlayPause logic)
      // The actual speaking for segment advance is handled by the onend callback in speakSegment
      // This effect is more like a safety net or could be used if onend wasn't robust.
      // For now, the onend in speakSegment directly calls setCurrentSegmentIndex, which then triggers visual update.
      // Let's simplify: speakSegment is called by handlePlayPause or by onend setting next index.
      // This effect below ensures that if we programmatically set currentSegmentIndex while isPlaying, it speaks.
      // This might be redundant if onend always correctly sets the next segment and speakSegment is called.
      // Let's test without it first, relying on onend in speakSegment to advance, and handlePlayPause to initiate.
      // The `onend` in `speakSegment` now just sets `setCurrentSegmentIndex`. A new effect is needed to speak.
       speakSegment(currentSegmentIndex);
    }
  }, [currentSegmentIndex, isPlaying, playbackStatus, video, speakSegment]); // speakSegment is memoized

  // Effect for Visual Synchronization
  useEffect(() => {
    if (video && video.visualIdeas.length > 0) {
      setCurrentVisualIndex(currentSegmentIndex % video.visualIdeas.length);
    }
  }, [currentSegmentIndex, video]);

  // Effect for Cleanup on Unmount
  useEffect(() => {
    return () => {
      if (speechSynthesisRef.current) {
        speechSynthesisRef.current.cancel();
      }
      if (utteranceRef.current) {
        utteranceRef.current.onend = null;
        utteranceRef.current.onerror = null;
      }
      // Clear any other timeouts if they were used
    };
  }, []);


  if (!apiKeyAvailable) {
    return (
      <div className="p-4 bg-gray-800 shadow-xl rounded-lg text-white w-full max-w-2xl mx-auto text-center py-10">
        <p className="text-gray-400">API Key not configured. Video preview is disabled.</p>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="p-4 bg-gray-800 shadow-xl rounded-lg text-white w-full max-w-2xl mx-auto text-center py-10">
        <p className="text-gray-400">No video generated yet. Add topics and process them.</p>
      </div>
    );
  }

  const currentVisual = video.visualIdeas.length > 0 ? video.visualIdeas[currentVisualIndex] : null;

  return (
    <div className="p-4 bg-gray-800 shadow-xl rounded-lg text-white w-full max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-indigo-400 mb-4">{video.titleSuggestion}</h2>
      
      {/* Visual Area - Using 16:9 aspect ratio */}
      <div className="mb-4 relative w-full bg-gray-700 rounded overflow-hidden" style={{ paddingBottom: '56.25%' /* 16:9 Aspect Ratio */ }}>
        {currentVisual ? (
          <>
            <img 
              src={currentVisual.imageUrl} 
              alt={currentVisual.description} 
              className="absolute top-0 left-0 w-full h-full object-cover" 
            />
            <p className="absolute bottom-0 left-0 w-full p-2 bg-black bg-opacity-50 text-xs">
              {currentVisual.description}
            </p>
          </>
        ) : (
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
            <p className="text-gray-400">No visual available for this segment.</p>
          </div>
        )}
      </div>

      {/* Script Display Area */}
      <div className="mb-4 p-3 bg-gray-700 rounded h-32 overflow-y-auto"> {/* Increased height for better scroll */}
        {video.scriptSegments.map((segment, index) => (
          <p key={segment.id} className={`p-1 rounded ${index === currentSegmentIndex ? 'font-semibold text-indigo-300 bg-gray-600' : 'text-gray-300'}`}>
            {segment.text}
          </p>
        ))}
      </div>

      {/* Controls Area */}
      <div className="flex items-center justify-center space-x-3 mb-4">
        <button 
          onClick={handlePlayPause}
          disabled={!video || video.scriptSegments.length === 0}
          className="py-2 px-4 rounded-md font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
          {isPlaying ? 'Pause' : (playbackStatus === 'paused' ? 'Resume' : 'Play')}
        </button>
        <button 
          onClick={handleStop}
          disabled={!video || video.scriptSegments.length === 0}
          className="py-2 px-4 rounded-md font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 bg-red-600 hover:bg-red-700 focus:ring-red-500 disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
          Stop
        </button>
      </div>
      
      {errorMessage && (
        <p className="text-red-400 text-sm mt-2 text-center">Error: {errorMessage}</p>
      )}
       {playbackStatus === 'ended' && (
        <p className="text-green-400 text-sm mt-2 text-center">Playback finished.</p>
      )}
    </div>
  );
};
