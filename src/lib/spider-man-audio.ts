export interface SpiderManAudioState {
  muted: boolean;
  playing: boolean;
}

export const spiderManAudioToggleEvent =
  "document-first:spider-man-audio-toggle";
export const spiderManAudioStateChangeEvent =
  "document-first:spider-man-audio-state-change";

let audioState: SpiderManAudioState = {
  muted: false,
  playing: false,
};

export const readSpiderManAudioState = () => audioState;

export const publishSpiderManAudioState = (state: SpiderManAudioState) => {
  audioState = state;
  window.dispatchEvent(
    new CustomEvent<SpiderManAudioState>(spiderManAudioStateChangeEvent, {
      detail: state,
    }),
  );
};

export const toggleSpiderManAudio = () => {
  window.dispatchEvent(new Event(spiderManAudioToggleEvent));
};
