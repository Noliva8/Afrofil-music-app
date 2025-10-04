
export function getAudioSupport() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return {
      opusWebM: false,
      opusOgg: false,
      aacMp4: true,
      isIOS: false,
      isSafari: false,
      client: false,
    };
  }

  const a = document.createElement('audio');
  const can = (t) => (a && a.canPlayType ? a.canPlayType(t) : '') || '';

  const ua = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);

  return {
    opusWebM: !!can('audio/webm; codecs="opus"'), // Chrome/Edge/Firefox
    opusOgg:  !!can('audio/ogg; codecs="opus"'),  // Firefox
    aacMp4:   !!can('audio/mp4; codecs="mp4a.40.2"'), // Safari/Chrome
    isIOS,
    isSafari,
    client: true,
  };
}
