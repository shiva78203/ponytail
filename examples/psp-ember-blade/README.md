# Ember Blade

An original top-down hack-and-slash homebrew for the PSP, built against
[PSPSDK](https://github.com/pspdev/pspdev) with `sceGu` immediate-mode 2D
rendering — no textures, no external assets, everything is drawn from
solid-color rectangles each frame.

## Controls

- D-Pad / analog stick — move
- **X** — slash (tap again within the combo window to chain up to a 3-hit combo)
- **START** — begin / restart

## What's here

- `src/main.c` — the whole game: title screen, wave-based enemy spawns,
  melee combo system, health orbs, game-over/restart loop.
- `src/Makefile` — standard PSPSDK build script.
- `src/EBOOT.PBP` — the compiled, runnable homebrew executable.
- `EmberBlade.iso` — the same build wrapped in a UMD-style ISO
  (`PSP_GAME/SYSDIR/EBOOT.BIN` + `PSP_GAME/PARAM.SFO`) for loaders that
  expect a disc image.

## Running it

**PPSSPP (desktop/mobile emulator):** open `src/EBOOT.PBP` or
`EmberBlade.iso` directly — either works.

**Real PSP hardware (custom firmware required):** copy the `EBOOT.PBP`
into a new folder under `PSP/GAME/EmberBlade/` on the memory stick. This
is the standard way homebrew is distributed and run — PSP homebrew
normally isn't shipped as an ISO; the ISO here is provided only because
it was asked for.

## Building from source

Requires the PSPSDK toolchain (`psp-gcc` etc.) on your `PATH`:

```bash
cd src
make
```

This regenerates `EBOOT.PBP`. To rebuild the ISO afterward:

```bash
mkdir -p iso_root/PSP_GAME/SYSDIR
cp src/EBOOT.PBP iso_root/PSP_GAME/SYSDIR/EBOOT.BIN
cp src/PARAM.SFO iso_root/PSP_GAME/PARAM.SFO
genisoimage -iso-level 1 -o EmberBlade.iso -V "EMBER_BLADE" iso_root
```

## Notes

This was built and compiled in a headless environment with no display or
emulator — it compiles clean and the game logic was written carefully,
but it has not been visually verified running. Please report back if
anything looks or plays wrong.
