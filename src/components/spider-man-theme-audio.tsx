import {
  publishSpiderManAudioState,
  spiderManAudioToggleEvent,
} from "@/lib/spider-man-audio";
import { themeChangeEvent, type Theme } from "@/lib/theme";
import { useEffect, useRef } from "react";

const backgroundVolume = 0.35;

export function SpiderManThemeAudio() {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = backgroundVolume;

    const publishState = () => {
      publishSpiderManAudioState({
        muted: audio.muted,
        playing: !audio.paused,
      });
    };

    const playFromStart = () => {
      audio.currentTime = 0;
      audio.muted = false;
      void audio.play().then(publishState).catch(() => {
        audio.muted = true;
        publishState();
      });
    };

    const stop = () => {
      audio.pause();
      audio.currentTime = 0;
      audio.muted = false;
      publishState();
    };

    const onThemeChange = (event: Event) => {
      const nextTheme = (event as CustomEvent<Theme>).detail;
      if (nextTheme === "spider-man") {
        playFromStart();
        return;
      }

      stop();
    };

    const onToggle = () => {
      if (!audio.paused && !audio.muted) {
        audio.muted = true;
        publishState();
        return;
      }

      audio.muted = false;
      if (audio.paused) {
        void audio.play().then(publishState).catch(() => {
          audio.muted = true;
          publishState();
        });
        return;
      }

      publishState();
    };

    window.addEventListener(themeChangeEvent, onThemeChange);
    window.addEventListener(spiderManAudioToggleEvent, onToggle);
    publishState();

    return () => {
      window.removeEventListener(themeChangeEvent, onThemeChange);
      window.removeEventListener(spiderManAudioToggleEvent, onToggle);
    };
  }, []);

  return (
    <audio
      ref={audioRef}
      src="/spider-man-homecoming-theme.mp3"
      preload="none"
      loop
      hidden
      data-spider-man-audio
    />
  );
}
