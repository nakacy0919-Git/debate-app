import { completeTopic } from './completeTopic.js';

// Load all twelve curriculum topics and make both debate stances playable.
// Data remains local to the app; no cloud requests or user information.
const topicFiles = import.meta.glob('../data/topics/*.json', { eager: true });

export const getAllTopics = () =>
  Object.values(topicFiles).map(file => completeTopic(file.default || file));
