// Nothing is exposed to the renderer - the frontend talks to the embedded
// server over plain HTTP (fetch/axios) exactly like it does in the browser,
// so no Electron-specific bridge APIs are needed today. Kept as an explicit,
// empty, context-isolated preload rather than disabling isolation.
