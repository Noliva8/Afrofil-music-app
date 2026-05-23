const shouldSilenceConsole =
  import.meta.env.PROD || import.meta.env.VITE_SILENCE_CONSOLE === 'true';

if (shouldSilenceConsole && typeof console !== 'undefined') {
  const noop = () => {};
  [
    'debug',
    'error',
    'group',
    'groupCollapsed',
    'groupEnd',
    'info',
    'log',
    'table',
    'time',
    'timeEnd',
    'trace',
    'warn',
  ].forEach((method) => {
    console[method] = noop;
  });
}
