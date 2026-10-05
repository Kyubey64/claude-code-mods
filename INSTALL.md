# Installing a mod (instructions for an AI assistant)

These steps are written for Claude Code (or any assistant with file and shell
access) installing a mod from this repository on the user's machine. A person
can follow them too.

A request looks like: *"Install the pixel-witch mod from
https://github.com/Kyubey64/claude-code-mods"*. The mod names are the folder names under
[`mods/`](mods/):

| Mod | What it is |
| --- | --- |
| `pixel-witch` | A pixel-art witch who wanders the terminal, follows the user between consoles, and sometimes picks fights |
| `usage-bar` | A session panel: context fill, 5-hour and weekly usage limits, model, effort, permission mode, running agents, notifications |

If the user names a mod that is not in `mods/`, list the ones that are and ask.

## Requirements

- Claude Code **2.1.288 or newer**: the mods use its function-hook plugin API
  (`claude plugin validate` must exist). Check with `claude --version`.
- `git`, or another way to download the repository.

## Steps

1. **Read the mod first.** It runs inside the user's Claude Code. Skim
   `mods/<name>/hooks/` and tell the user in one or two lines what it does
   and anything it touches outside Claude Code (see *Per-mod notes* below).

2. **Download the repository** to a temporary folder, for example:

   ```sh
   git clone --depth 1 https://github.com/Kyubey64/claude-code-mods "<temp>/claude-code-mods"
   ```

3. **Copy the mod** to a permanent folder in the user's home directory:

   - macOS / Linux: `~/.claude/mods/<name>/`
   - Windows: `%USERPROFILE%\.claude\mods\<name>\`

   Copy the whole `mods/<name>/` folder (`.claude-plugin/`, `hooks/`, and
   `types/` when present). If the folder already exists, this is an update:
   replace its contents.

4. **Check it** with the absolute path of the copied folder:

   ```sh
   claude plugin validate "<absolute path to the mod folder>"
   claude plugin test "<absolute path to the mod folder>"
   ```

   `validate` must pass (warnings about a missing author are fine). If it
   fails, stop and show the user the error: the installed Claude Code is
   probably too old.

5. **Register the folder** in the user's settings file, `~/.claude/settings.json`
   (`%USERPROFILE%\.claude\settings.json` on Windows). Mods load from the
   folders listed in the `CLAUDE_CODE_PLUGIN_DIRS` variable of its `env`
   block:

   ```json
   {
     "env": {
       "CLAUDE_CODE_PLUGIN_DIRS": "/home/me/.claude/mods/pixel-witch"
     }
   }
   ```

   - Use the **absolute** path.
   - Several folders are joined with the platform's path-list separator:
     `;` on Windows, `:` on macOS and Linux.
   - **Keep what is there.** If the variable already lists folders, append the
     new one (skip it if already listed). Leave every other setting as it is,
     and keep the file valid JSON (on Windows, backslashes are doubled).
   - It must be the user settings file. A project's `.claude/settings.json`
     is ignored for this variable.

6. **Tell the user to start a new Claude Code session.** Running sessions do
   not pick up the change; new ones load the mod by themselves. Mention the
   mod's commands (below).

## Per-mod notes

### pixel-witch

- Best in Claude Code's **fullscreen** layout: there she roams the whole
  conversation; on the normal screen she walks a strip above the prompt.
- Consoles coordinate through small files in `~/.claude/pixel-witch-coven/`
  (heartbeats and a shared world file). Nothing leaves the machine.
- Commands: `/witch` (hide or show), `/witch skin <classic|starlight|moonbroom|bluebell|goldie>`,
  `/witch summon`, `/witch fight`. Right-click her to hide her in that console;
  drag her with the left button.
- Setting: *Witch skin* in the config menu (`random` allowed).

### usage-bar

- Opens a **Session** panel on the right on wide fullscreen terminals; `/hud`
  opens it on demand. Without the panel it falls back to a status line.
- To keep the usage figures fresh while idle, it can send **one tiny Haiku
  request** when no console has had a fresh reading for 10 minutes, and stops
  after an hour of idle readings. This uses a sliver of the user's usage
  limits. `/usage-ping off` (or the panel's *turn pings off* button) stops
  them in every console at once, `/usage-ping on` resumes; the *Ping interval
  (minutes)* setting changes the interval.
- Commands: `/hud`, `/usage-ping` (ping now), `/usage-ping off`, `/usage-ping on`.

## Updating and removing

- **Update:** repeat steps 2 to 4 over the same folder, then start a new session.
- **Remove:** delete the mod's path from `CLAUDE_CODE_PLUGIN_DIRS` (and the
  separator next to it), delete its folder, and for `pixel-witch` also
  `~/.claude/pixel-witch-coven/`.
