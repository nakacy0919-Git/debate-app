export const useSound = () => {
  const playSound = (soundName) => {
    const audio = new Audio(`/sounds/${soundName}.mp3`);
    audio.volume = 0.5; 
    audio.play().catch(e => console.log("Audio play failed:", e));
  };

  return { playSound };
};