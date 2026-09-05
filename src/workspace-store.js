import {
  settingsStore,
} from "./settings-store.js";

import {
  clearBrowserPersonalEvents,
  loadBrowserPersonalEvents,
  saveBrowserPersonalEvents,
} from "./personal-events-store.js";

import {
  clearBrowserEventCustomizations,
  loadBrowserEventCustomizations,
  saveBrowserEventCustomizations,
} from "./event-customizations-store.js";

export const workspaceStore = {
  settings: settingsStore,

  personalEvents: {
    load: loadBrowserPersonalEvents,
    save: saveBrowserPersonalEvents,
    clear: clearBrowserPersonalEvents,
  },

  eventCustomizations: {
    load: loadBrowserEventCustomizations,
    save: saveBrowserEventCustomizations,
    clear: clearBrowserEventCustomizations,
  },
};
