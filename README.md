# Guake Follow Cursor

A GNOME Shell extension that moves the [Guake](http://guake-project.org/) dropdown
terminal to whichever monitor your mouse cursor is currently on, every time it opens.

- UUID: `guake-follow-cursor@[placeholder].local`
- Supported shell versions: 45, 46, 47, 48
- Tested on: Ubuntu 24.04, Wayland session

## How it works

`extension.js` listens for two GNOME Shell signals:

- `global.display::window-created` — fires the first time Guake's window is created.
- `global.window_manager::map` — fires every time a window is shown, which is what
  actually catches Guake being toggled visible again (Guake reuses the same window
  instead of creating a new one on every toggle).

On each event, if the window's WM class contains `guake`, the extension reads the
current pointer position, works out which monitor it's on
(`global.display.get_monitor_index_for_rect`), and moves the window there with
`window.move_to_monitor()` if it isn't already on that monitor.

## Files

| File            | Purpose                                                             |
|-----------------|----------------------------------------------------------------------|
| `metadata.json` | Extension manifest (uuid, name, supported shell versions).          |
| `extension.js`  | The extension logic itself.                                         |
| `install.sh`    | Copies the files into place and enables the extension.              |

## Installation (local)

Before installing, replace `[placeholder]` in `metadata.json` and `install.sh` with
your own identifier (e.g. your name or domain), so the UUID looks like
`guake-follow-cursor@yourname.local`:

```bash
sed -i 's/\[placeholder\]/yourname/' metadata.json install.sh
```

Then run:

```bash
chmod +x install.sh
./install.sh
```

The script copies `metadata.json` and `extension.js` to:

```
~/.local/share/gnome-shell/extensions/guake-follow-cursor@[placeholder].local/
```

and then runs `gnome-extensions enable guake-follow-cursor@[placeholder].local`.

### Wayland caveat (important)

GNOME Shell only scans `~/.local/share/gnome-shell/extensions/` for **new** UUIDs at
login. Unlike X11 (where `Alt+F2` → `r` restarts the shell in place), Wayland sessions
cannot restart the shell without a full logout.

So the **first time** you install this extension:

1. Run `./install.sh`.
2. If it reports the shell doesn't see the extension yet, **log out and log back in**.
3. Run `gnome-extensions enable guake-follow-cursor@[placeholder].local`.

After that first install, editing `extension.js` and re-running `install.sh` does
**not** require a logout — just run:

```bash
gnome-extensions disable guake-follow-cursor@[placeholder].local
gnome-extensions enable  guake-follow-cursor@[placeholder].local
```

### If user extensions are globally disabled

Check with:

```bash
gsettings get org.gnome.shell disable-user-extensions
```

If it prints `true`, extensions are disabled shell-wide (e.g. via GNOME Tweaks'
"Extensions" master switch, or an admin policy). Fix it with:

```bash
gsettings set org.gnome.shell disable-user-extensions false
```

(`install.sh` already does this for you.)

## Verifying it's active

```bash
gnome-extensions info guake-follow-cursor@[placeholder].local
```

Look for `State: ACTIVE` and `Enabled: Yes`. To check for runtime errors:

```bash
gdbus call --session --dest org.gnome.Shell.Extensions \
  --object-path /org/gnome/Shell/Extensions \
  --method org.gnome.Shell.Extensions.GetExtensionErrors \
  "guake-follow-cursor@[placeholder].local"
```

An empty array (`([],)`) means no errors.

## Uninstall

```bash
gnome-extensions disable guake-follow-cursor@[placeholder].local
rm -rf ~/.local/share/gnome-shell/extensions/guake-follow-cursor@[placeholder].local
```

## Publishing to GitHub

1. Create a new empty repository on GitHub (no README/license, since we already
   have files locally), e.g. `guake-follow-cursor`.
2. From this folder, initialize git and make the first commit:

   ```bash
   cd ~/Desktop/guake-follow-cursor
   git init
   git add metadata.json extension.js install.sh README.md
   git commit -m "Initial commit: Guake Follow Cursor GNOME extension"
   ```

3. Point it at your GitHub repo and push (replace `YOUR_USERNAME`):

   ```bash
   git branch -M main
   git remote add origin git@github.com:YOUR_USERNAME/guake-follow-cursor.git
   git push -u origin main
   ```

   (Use the HTTPS URL instead of SSH if you haven't set up an SSH key with GitHub:
   `https://github.com/YOUR_USERNAME/guake-follow-cursor.git`.)

4. Done — the repo now has `metadata.json`, `extension.js`, `install.sh`, and this
   `README.md`. Anyone can install it by cloning and running `./install.sh`.
