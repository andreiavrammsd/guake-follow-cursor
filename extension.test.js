import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

function createSignalBus() {
  const listeners = new Map();

  return {
    listeners,
    connect(signal, callback) {
      const id = Symbol(`signal:${String(signal)}`);
      listeners.set(id, { signal, callback });
      return id;
    },
    disconnect(id) {
      listeners.delete(id);
    },
    trigger(signal, ...args) {
      for (const listener of listeners.values()) {
        if (listener.signal === signal) {
          listener.callback(...args);
        }
      }
    },
  };
}

async function loadExtension(globalState) {
  const source = await fs.readFile(new URL('./extension.js', import.meta.url), 'utf8');

  const transformed = source
    .replace(
      "import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';",
      'const { Extension } = global.__ExtensionBase;'
    )
    .replace(
      "import * as Main from 'resource:///org/gnome/shell/ui/main.js';",
      'const Main = global.__MainModule;'
    )
    .replace('export default class GuakeFollowCursorExtension extends Extension {', 'class GuakeFollowCursorExtension extends Extension {')
    .replace(/export default /g, '');

  const evaluator = new Function('global', `${transformed}\n global.__GuakeFollowCursorExtension = GuakeFollowCursorExtension;`);
  evaluator(globalState);

  return globalState.__GuakeFollowCursorExtension;
}

test('enables Guake-follow-cursor listeners and moves a Guake window to the pointer monitor', async () => {
  const globalState = {
    __ExtensionBase: { Extension: class Extension {} },
    __MainModule: { layoutManager: { monitors: [
      { x: 0, y: 0, width: 100, height: 100 },
      { x: 100, y: 0, width: 100, height: 100 },
    ] } },
    display: createSignalBus(),
    window_manager: createSignalBus(),
    get_pointer: () => [150, 50],
  };

  const Extension = await loadExtension(globalState);
  const instance = new Extension();

  instance.enable();

  assert.ok(instance._createdId !== null);
  assert.ok(instance._mapId !== null);

  const window = {
    get_wm_class: () => 'Guake',
    get_monitor: () => 0,
    move_to_monitor: (target) => {
      window.targetMonitor = target;
    },
  };

  instance._maybeMove(window);
  assert.equal(window.targetMonitor, 1);

  instance.disable();
  assert.equal(globalState.display.listeners.size, 0);
  assert.equal(globalState.window_manager.listeners.size, 0);
});

test('ignores windows that are not Guake or are already on the pointer monitor', async () => {
  const globalState = {
    __ExtensionBase: { Extension: class Extension {} },
    __MainModule: { layoutManager: { monitors: [
      { x: 0, y: 0, width: 100, height: 100 },
      { x: 100, y: 0, width: 100, height: 100 },
    ] } },
    display: createSignalBus(),
    window_manager: createSignalBus(),
    get_pointer: () => [25, 25],
  };

  const Extension = await loadExtension(globalState);
  const instance = new Extension();
  instance.enable();

  const nonGuake = {
    get_wm_class: () => 'Terminal',
    get_monitor: () => 0,
    move_to_monitor: () => {
      throw new Error('non-Guake windows should not move');
    },
  };

  instance._maybeMove(nonGuake);

  const sameMonitor = {
    get_wm_class: () => 'Guake',
    get_monitor: () => 0,
    move_to_monitor: () => {
      throw new Error('same monitor windows should not move');
    },
  };

  instance._maybeMove(sameMonitor);
  assert.ok(true);

  instance.disable();
});

test('does nothing when no window is available', async () => {
  const globalState = {
    __ExtensionBase: { Extension: class Extension {} },
    __MainModule: { layoutManager: { monitors: [
      { x: 0, y: 0, width: 100, height: 100 },
    ] } },
    display: createSignalBus(),
    window_manager: createSignalBus(),
    get_pointer: () => [10, 10],
  };

  const Extension = await loadExtension(globalState);
  const instance = new Extension();
  instance.enable();

  instance._maybeMove(null);
  assert.equal(globalState.display.listeners.size, 1);
  assert.equal(globalState.window_manager.listeners.size, 1);

  instance.disable();
});
