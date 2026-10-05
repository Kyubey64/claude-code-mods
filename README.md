# Claude Code mods

Mods for [Claude Code](https://claude.com/claude-code), built on its
function-hook plugin API: they draw inside the terminal and react to what
Claude is doing.

> **Installing with an AI assistant:** tell Claude Code
> *"Install the pixel-witch mod from https://github.com/Kyubey64/claude-code-mods"*.
> The steps it follows are in [INSTALL.md](INSTALL.md).

## pixel-witch

A chibi pixel-art witch who lives in your terminal.

- **Wanders** over the conversation (fullscreen) or a strip above the prompt,
  and **reacts**: a thinking bubble while Claude works, spell sparkles during
  tool calls, a `!` when one fails, a happy hop when a reply lands, and a nap
  when things go quiet.
- **Drag her** with the mouse and she grumbles ("hmph!", "put me down!") and
  sulks after. **Right-click** to hide her.
- **Follows you between consoles**: she leaps out of one and drops into the
  one you are typing in.
- **Five styles**, each its own drawing: `classic` (round chibi), `starlight`
  (huge floppy hat, glowing star, cloud of lavender hair), `moonbroom` (rides a
  broom side-saddle with a cat), `bluebell` (super-deformed, giant eyes, gem
  staff, cat on her shoulder), `goldie` (tall and slender, long golden hair,
  upright broom).
- With two consoles open, **a second witch** sometimes visits. Rarely they
  fight: the victim's console is visually wrecked by glitch streaks until a
  giant hand comes down, grabs the attacker and hauls her off, and a new
  witch drops in. (Only the drawing; your text is never touched.)

Commands: `/witch`, `/witch skin <name>`, `/witch summon`, `/witch fight`.

## usage-bar (session panel)

A panel docked on the right while the prompt stays at the bottom:

- **Usage**: context fill, 5-hour and weekly limits with reset countdowns,
  as colored meters. Readings are shared between your consoles, and an
  optional tiny Haiku ping keeps them fresh while idle (pausing after an idle
  hour).
- **Session**: model and effort, permission mode (auto, plan, ...), git
  branch, uptime, working or idle.
- **Agents**: running subagents, then the last few finished.
- **Notifications**: usage warnings, finished agents, and every mod's toasts,
  timestamped.

On narrow or non-fullscreen terminals it falls back to a one-line status bar.
Commands: `/hud`, `/usage-ping` (ping now), `/usage-ping off` / `on` (automatic
pings in every console).

## Requirements

- Claude Code 2.1.288 or newer. The function-hook API is early access and may
  change between releases.
- The visuals are tuned for Claude Code's fullscreen terminal layout.

## Development

Each mod is a plugin folder (`.claude-plugin/plugin.json`, `hooks/`,
`types/`). Check one with:

```sh
claude plugin validate mods/pixel-witch
claude plugin test mods/pixel-witch
```

The witch styles are drawn in [`tools/witch_styles.py`](tools/witch_styles.py),
which renders a preview sheet and regenerates `mods/pixel-witch/hooks/styles.ts`.

## License

[MIT](LICENSE)
