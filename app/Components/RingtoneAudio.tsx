import React, { useEffect, useRef } from 'react';

interface Props {
  isPlaying: boolean;
}

const RingtoneAudio: React.FC<Props> = ({ isPlaying }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isPlaying && audioRef.current) {
      audioRef.current.play().catch(error => {
        console.error('Ses çalma hatası:', error);
      });
    } else if (!isPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [isPlaying]);

  return (
    <audio
      ref={audioRef}
      src="/ringtone.mp3"
      preload="auto"
      loop
    />
  );
};

export default RingtoneAudio;