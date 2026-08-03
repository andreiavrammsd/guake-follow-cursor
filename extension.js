import Meta from 'gi://Meta';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

export default class GuakeFollowCursorExtension extends Extension {
  enable() {
    // Fires once when a new window is first created (covers Guake's
    // initial launch).
    this._createdId = global.display.connect('window-created', (_display, window) => {
      this._maybeMove(window);
    });

    // Fires every time any window is mapped (shown) - this is what
    // catches Guake being toggled visible again after being hidden,
    // since Guake keeps reusing the same window rather than creating
    // a new one each time.
    this._mapId = global.window_manager.connect('map', (_wm, actor) => {
      this._maybeMove(actor.meta_window);
    });
  }

  _maybeMove(window) {
    if (!window) {
      return;
    }

    const wmClass = (window.get_wm_class() || '').toLowerCase();
    if (!wmClass.includes('guake')) {
      return;
    }

    const [x, y] = global.get_pointer();
    const rect = new Meta.Rectangle({ x, y, width: 1, height: 1 });
    const targetMonitor = global.display.get_monitor_index_for_rect(rect); // Get monitor where is cursor

    // Check if Guake was lastly opened at the same location where cursor is currently
    if (window.get_monitor() !== targetMonitor) {
      window.move_to_monitor(targetMonitor);
    }
  }

  disable() {
    if (this._createdId) {
      global.display.disconnect(this._createdId);
      this._createdId = null;
    }
    if (this._mapId) {
      global.window_manager.disconnect(this._mapId);
      this._mapId = null;
    }
  }
}
