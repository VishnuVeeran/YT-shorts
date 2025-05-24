import { GeneratedVideo, VideoDuration } from '../types';
import {
  PLACEHOLDER_IMAGE_BASE_URL,
  PLACEHOLDER_IMAGE_HEIGHT,
  PLACEHOLDER_IMAGE_WIDTH,
} from '../constants';

export const generateScriptAndVisuals = (
  topic: string,
  duration: VideoDuration
): Promise<Omit<GeneratedVideo, 'topic' | 'duration'>> => {
  console.log(
    `Generating script for topic: ${topic}, duration: ${duration}`
  );

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (topic.toLowerCase().includes('error')) {
        reject(
          new Error(
            `Failed to generate content for topic: ${topic} due to simulated error.`
          )
        );
        return;
      }

      const titleSuggestion = `Amazing Facts about ${topic}`;
      const scriptSegments = [
        {
          id: 'segment-1',
          text: `Welcome! Today we're talking about ${topic}.`,
        },
        {
          id: 'segment-2',
          text: `Let's explore some interesting aspects of ${topic}.`,
        },
        {
          id: 'segment-3',
          text: `In summary, ${topic} is quite fascinating!`,
        },
      ];

      const visualIdeas = [
        {
          id: 'visual-1',
          description: `A cool visual for ${topic}`,
          imageUrl: `${PLACEHOLDER_IMAGE_BASE_URL}/${PLACEHOLDER_IMAGE_WIDTH}/${PLACEHOLDER_IMAGE_HEIGHT}?random=1`,
        },
        {
          id: 'visual-2',
          description: `Another interesting visual for ${topic}`,
          imageUrl: `${PLACEHOLDER_IMAGE_BASE_URL}/${PLACEHOLDER_IMAGE_WIDTH}/${PLACEHOLDER_IMAGE_HEIGHT}?random=2`,
        },
        {
          id: 'visual-3',
          description: `A final visual representation for ${topic}`,
          imageUrl: `${PLACEHOLDER_IMAGE_BASE_URL}/${PLACEHOLDER_IMAGE_WIDTH}/${PLACEHOLDER_IMAGE_HEIGHT}?random=3`,
        },
      ];

      const keyPhrases = [
        topic,
        `learn about ${topic}`,
        `interesting ${topic}`,
        `${topic} facts`,
      ];

      resolve({
        titleSuggestion,
        scriptSegments,
        visualIdeas,
        keyPhrases,
      });
    }, 1500); // Simulate 1.5 seconds delay
  });
};
