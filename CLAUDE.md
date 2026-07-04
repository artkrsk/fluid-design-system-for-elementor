# CLAUDE.md

Guidance for Claude Code working in the **Fluid Design System for Elementor** plugin.

## Role

Adds fluid typography/spacing presets to Elementor. Each preset compiles to a CSS `clamp()` formula
exposed as a `--arts-fluid-preset--{id}` variable, so sizes scale smoothly between a min and max
screen width instead of snapping at breakpoints. Two layers bound by frozen string contracts:

- **PHP (`src/php/`)** — admin group-management UI + Elementor Kit / Site-Settings integration. Owns
  persistence (WP options + Kit repeater meta), the Site Settings tab, AJAX, and the WP
  Abilities / MCP surface.
- **TypeScript (`src/ts/`)** — live preset editing inside Elementor editor panels. Extends control
  views, drives the preview iframe's CSS variables, and tracks undo/redo via an Elementor hook system.

## Elementor v4 (atomic editor / elements) — out of scope

This plugin targets the **classic (v3) editor only**. The `Units` manager's `'fluid'` `size_unit`
injection and the `addControlView` control views do **not** reach v4 **atomic** widgets — those are React
prop-type controls with a fixed unit list (no `size_units` to inject, no `addControlView`).

A v4 integration via the new **Variables** system was spiked and deliberately dropped (2026-07). Blockers:

- A third-party variable type registers fine (`elementor/variables/register` PHP + `registerVariableType`
  JS) and emits `:root { --…: clamp(…) }`, but it **cannot be bound to atomic size controls**: the
  prop-type schema / `Prop_Type_Adapter` that decides which variable types a size prop accepts is a
  hardcoded, unfilterable map, and our key isn't in it (verified — even forcing `variableType: 'size'` +
  `isCompatible` didn't surface it in the picker).
- The only native type that holds an arbitrary CSS `clamp()` and binds/renders is
  `global-custom-size-variable`, which is **Elementor Pro-only** — a Pro-gated regression vs this plugin's
  current free+Pro reach.
- The whole v4 Variables surface is alpha/beta and undocumented (as of Elementor 4.2.0-beta1 its
  `@elementor/http-client` boots without REST config, leaving the Variables UI non-functional without a
  workaround).

Revisit only if Elementor opens the prop-type schema to third-party variable types (which would let a
free-compatible fluid type bind) or ships a stable, documented public API for this.

## Research before guessing (3rd parties)

Don't answer questions about external code from training memory — pull authoritative data first, then
decide. For anything touching a 3rd party:

- **Elementor internals** (core + Pro) — `elementor-backend` (PHP) / `elementor-frontend` (JS). Never
  grep `src/` for Elementor's own code.
- **WordPress core** — `wordpress-internals`.
- **Other 3rd-party plugins** — `plugin-internals`.
- **`@arts/*` framework packages** — `arts-framework`.
- **Library / framework / CLI / tooling docs** (CI, dev server, test runners, build, linters, and any
  external lib — but not limited to those) — `context7` MCP. Fetch current docs even for well-known
  tools; APIs drift.
- **Visual verification** — `chrome-devtools` MCP, only when a change genuinely must be _seen_
  (rendered preview, layout, editor UI). Skip it for logic that a headless test covers.

## Layout

```
src/php/  (namespace Arts\FluidDesignSystem\, PSR-4 → src/php/)
  Plugin.php              bootstrap; get_managers_classes() registry + add_actions/add_filters
  Base/                   thin local subclasses of the arts/* framework Plugin/Manager/ManagersContainer
  Managers/
    ControlRegistry       control-ID generate/parse (frozen pattern)
    CSSVariables          CSS-var constants + clamp() formula builder
    Data / GroupsData     custom-group CRUD (WP options) / aggregate builtin+custom+filter groups
    Units                 inject 'fluid' size unit into eligible controls; optimize Kit CSS
    Abilities             WP Abilities API + MCP server
    Options Extension Compatibility Notices
    Admin/                admin page, asset enqueue, Tabs/Groups (AJAX, Handlers, View)
  Services/KitRepeaterService   Kit repeater-meta CRUD (get/update/delete/move item)
  Elementor/
    Tabs/FluidTypographySpacing   Site Settings tab; builds fluid-preset repeater controls
    Units/Fluid/Module            editor AJAX handlers (preset data for control dropdowns)

src/ts/  (all .ts; entry index.ts)
  index.ts                registers control views on 'elementor/init'; hook system on 'elementor/init-components'
  components/Component.ts  $e component; maps Elementor commands → hook classes
  hooks/                   HookOnRepeater{Add,Remove,Reorder}, HookOnDocumentSave, HookOnKitSettingsSave
  views/                   Base* mixins + Dimensions/Slider/Gaps/RepeaterRow/GlobalStyleRepeater views
  managers/                CSSManager, StateManager, DataManager, PreviewSizeManager (singletons)
  services/presetAPI.ts    PresetAPIService — editor AJAX wrappers
  constants/               STYLES, ELEMENTOR, API, VALUES
  utils/ interfaces/ types/  helpers; I-prefixed interfaces, T-prefixed types, one per file
```

## Public API

**PHP managers** (resolved through the `Plugin` managers container; register new ones in
`get_managers_classes()`):

- `ControlRegistry` — `get_custom_group_control_id($id): string` → `fluid_custom_{id}_presets`;
  `parse_control_id($id): array|false` → `['type'=>'builtin'|'custom','group_id'=>…]`; builtin/custom
  group metadata.
- `CSSVariables` — `get_clamp_formula($min,$max,$minScreen?,$maxScreen?): string`;
  `get_css_var_preset($id): string` → `--arts-fluid-preset--{id}`.
- `Data` — custom-group CRUD over option `arts_fluid_design_system_custom_groups`; ordering in
  `arts_fluid_design_system_main_group_order`.
- `GroupsData` — merges builtin + custom + filter-injected groups for read paths.
- `Units` — fluid-unit eligibility (`is_control_eligible_for_fluid_unit`) + Kit CSS optimization.
- `Abilities` — registers the `fluid/*` abilities and MCP server.

**PHP service** — `KitRepeaterService` (static): `get_item / update_item / delete_item /
move_item($kit, $control_id, $item_id, …)`. Mutates Kit repeater meta **and** mirrors to the autosave
document. The only correct path for programmatic preset writes.

**JS managers** (singletons; `window.artsFluidDesignSystem.dataManager` exposed for dialogs):

- `CSSManager` — `setCssVariable(id, clampFormula)` / `unsetCssVariable(id)` (writes
  `unset !important`) / `restoreCssVariable(id)` (drops the unset rule), on a
  `<style id="fluid-design-system-for-elementor-style">` in the preview iframe.
- `StateManager` — undo/redo bookkeeping: `markItemAsRemoved/markItemAsRestored/hasRemovedItems`,
  `setRecentRemoval/hasRecentRemoval/cleanupRecentRemovals` (~200ms window separates reorder from
  delete), plus document-change tracking.
- `DataManager` — caches editor preset data; `invalidate()` on Kit save.
- `PreviewSizeManager` — resizes the preview iframe to the min/max screen anchor for in-context editing.

**JS service** — `PresetAPIService` (static): `fetchGroups()`, `savePreset(data)`,
`updatePreset(data)` over the editor AJAX actions below.

## Hooks & contracts

**Installs (WP / Elementor):**

- `elementor/init` (register control views), `elementor/init-components` (register hook system),
  `elementor/element/after_section_end` (inject fluid unit), `elementor/ajax/register_actions`
  (editor AJAX), `elementor/editor/*_enqueue_*` (assets), `elementor/css-file/post/parse` +
  `elementor/files/css/selectors` (Kit CSS cleanup).
- `admin_menu`, `admin_enqueue_scripts`, `wp_ajax_fluid_design_system_admin_action` (admin UI; nonce
  `fluid_design_system_ajax_nonce`).
- `wp_abilities_api_init`, `wp_abilities_api_categories_init`, `wp_after_execute_ability`,
  `mcp_adapter_init` — all no-ops when those APIs are absent.
- Filters into the `arts/elementor_extension/*` framework (tabs, plugin config, strings).

**Editor AJAX actions** (`arts_fluid_design_system_*`): `presets`, `get_groups`, `save_preset`,
`update_preset`.

**Internal JS hook system** — registered as `$e` component namespace
`fluid-design-system-for-elementor-hooks`. Before/After hooks intercept
`document/repeater/{insert,remove,move}` and `document/save/{save,update}`:

```
remove (Before): StateManager.markItemAsRemoved + setRecentRemoval → CSSManager.unsetCssVariable
insert (After):  if restored/reordered → CSSManager.restoreCssVariable → markItemAsRestored
save   (After):  StateManager clears doc changes; DataManager.invalidate()
```

This is what makes undo/redo of preset edits restore the correct CSS variables.

## Frozen contracts (must stay identical across both layers)

- **Control IDs** — builtin `fluid_spacing_presets`, `fluid_typography_presets`; custom
  `fluid_custom_{group_id}_presets`. PHP: `ControlRegistry`. JS: `isFluidPresetRepeater()` in
  `utils/controls.ts` (matches the two builtins + `/^fluid_custom_.+_presets$/`).
- **CSS-var prefix** — `--arts-fluid-preset--`. PHP `CSSVariables::CSS_VAR_PRESET_PREFIX` **must equal**
  JS `STYLES.VAR_PREFIX`. Change one without the other and preview rendering silently breaks.
- **Abilities / MCP** — ability category and MCP server name are both `fluid-design-system`; abilities
  are namespaced `fluid/*` (list/get/create/rename/delete groups; list/get/create/update/delete/move
  presets). Reads gate on `edit_posts`, writes on `manage_options`.
- **Kit settings keys** — preset repeaters live under their control IDs in Kit meta; global screen
  bounds `min_screen_width` / `max_screen_width` (defaults 360 / 1920).
- **WP options** — `arts_fluid_design_system_custom_groups`, `arts_fluid_design_system_main_group_order`.

## Gotchas / invariants

- **Never bypass the Kit API.** Preset writes go through `KitRepeaterService` →
  `$kit->add_repeater_row()` / the Kit (`page`) settings manager, and must also touch the autosave
  document. Writing Kit meta directly desyncs the editor.
- **AbortController cleanup is mandatory.** Control-view `onDestroy()` must `abort()` every per-setting
  `AbortController` and unregister the preview switcher, then `callSuper`. Skipping it leaks listeners
  across panel re-renders.
- **Mixin-based view extension.** Views are Backbone mixins, not subclasses:
  `editor.modules.controls.<Type>.extend({...BaseControlView, ...Base<Type>ControlView},
{...BaseControlViewStatic})`, registered via `editor.addControlView()`. Add control support by
  composing the existing Base mixins.
- **Undo/redo timing.** Reorder vs delete is disambiguated only by the ~200ms `recentRemovals` window
  in `StateManager`; don't widen/narrow it casually.
- **Fluid unit is opt-in per control.** `Units` only adds `'fluid'` to controls whose `size_units`
  already include `'custom'`; eligibility is filterable, not universal.
- **Off-limits to grep.** Never search `src/` for Elementor's own internals or `@arts/*` framework
  code — use the research agents (see _Research before guessing_ above).

## Dependencies & build

- **Composer:** `arts/elementor-extension`, `arts/utilities` (pull in `arts/base`). Strauss prefixes
  these into `vendor-prefixed/` under `ArtsFluidDS\` (classmap-autoloaded) so the shipped plugin can't
  collide with other Arts plugins — run via `composer prefix-namespaces`.
- **QA:** PHPStan `level: max` (PHP 8.0 target) over `src/php`; PHPCS (WPCS); Vitest unit tests;
  Playwright e2e.
- **Build:** `npm run dev` (watch — already running, don't start it) / `npm run build`
  (composer install + prefix + JS build). The distributable plugin is assembled in
  `src/wordpress-plugin/` (main file `fluid-design-system-for-elementor.php`) and zipped to `dist/`.
  Never run `build` / `dev` yourself.

## Release & version stamping

- **Version headers are stamped, not hand-edited.** Every build (and dev startup / composer.json
  change while watching) runs `updatePluginMeta` (`__build__/utils/wordpress/plugin-meta.js`), which
  rewrites the plugin header and readme.txt meta fields: `Version:` / `Stable tag:` come from
  `package.json` `version` (single source of truth); `Requires PHP` / `Requires at least` /
  `Tested up to` from composer.json's `wordpress` object; name/description/URI/license/text domain
  from its `plugin` object. Manual edits to these in `src/wordpress-plugin/` get overwritten.
- **Changelog is the one manual step.** Hand-write the new entry in `src/wordpress-plugin/readme.txt`
  under `== Changelog ==` (user-facing, non-technical tone — match existing entries).
  `scripts/sync-changelog.js` regenerates CHANGELOG.md from readme.txt, never the reverse.
- **Release flow:** readme.txt changelog entry first, then the user runs `npm version <x.y.z>` — its
  `version` lifecycle script builds (stamping versions), syncs CHANGELOG.md, and stages; npm then
  commits and tags. Pushing the `v*` tag runs `.github/workflows/release.yml`: GitHub release + wp.org
  SVN deploy, validating plugin header / readme.txt / package.json all match the tag version.

**Stack:** PHP 8.0+ · WordPress 6.0+ · Elementor 3.27+ · ES2022 / TypeScript · Sass
