// src/utils/dataLoader.js
// topicsフォルダ内のJSONファイルをすべて読み込む
const topicFiles = import.meta.glob('../data/topics/*.json', { eager: true });

export const getAllTopics = () => {
  // ファイルの中身を取り出して、ひとつの配列にまとめる
  return Object.values(topicFiles).map(file => file.default || file);
};