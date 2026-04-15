# Design System Strategy: The Methodical Muse

## 1. Overview & Creative North Star
The North Star for this design system is **"Architectural Clarity."** 

Standard productivity apps often feel cluttered, relying on heavy borders and loud grids that compete with the user’s focus. This system moves beyond the "standard" by treating the UI as a series of sophisticated, layered architectural planes. We prioritize intentional asymmetry and tonal depth over rigid lines. By using high-contrast typography scales (the interplay between the expressive *Manrope* and the functional *Inter*), we create an editorial feel that makes a simple task list look like a curated workspace.

## 2. Colors & Surface Logic
The palette is built on a foundation of "Cool Porcelain" neutrals (`#f7f9fb`) and "Deep Kinetic Blue" (`#0051c9`). 

### The "No-Line" Rule
To achieve a premium, high-end feel, **do not use 1px solid borders for sectioning.** Boundaries must be defined through background color shifts. For example, a sidebar should use `surface_container_low` against a `surface` main content area. This creates a softer, more sophisticated transition that feels intentional rather than "templated."

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. Use the `surface_container` tokens to create depth:
*   **Base Layer:** `surface` (#f7f9fb)
*   **Secondary Sections:** `surface_container_low` (#f2f4f6)
*   **Floating Cards/Inputs:** `surface_container_lowest` (#ffffff)
*   **Active Overlays:** `surface_container_highest` (#e0e3e5)

### The "Glass & Gradient" Rule
For floating elements (like task drawers or calendar modals), use **Glassmorphism**. Combine `surface_container_lowest` at 80% opacity with a `backdrop-blur` of 12px. To give primary actions "soul," use a subtle linear gradient on buttons transitioning from `primary` (#0051c9) to `primary_container` (#316be4).

## 3. Typography: Editorial Authority
We utilize a dual-typeface system to balance personality with extreme legibility.

*   **Display & Headlines (Manrope):** Use these for high-level context (e.g., "Good Morning," or "March 2024"). The generous x-height and geometric curves of Manrope provide an "Editorial Modern" look.
*   **Body & Labels (Inter):** Inter is our workhorse. Use it for task descriptions, metadata, and inputs. It is designed for maximum clarity at small sizes.

**The Hierarchy Rule:** Always pair a `display-sm` (Manrope) with a `label-md` (Inter, All-Caps, Tracking +5%) to create a sophisticated, rhythmic contrast between the title and the metadata.

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are often too heavy. This system relies on **Tonal Layering**.

*   **The Layering Principle:** Place a `surface_container_lowest` card on top of a `surface_container_low` background. The subtle shift from `#f2f4f6` to `#ffffff` provides enough contrast to define a container without a single line of CSS border.
*   **Ambient Shadows:** If an element must "float" (e.g., a dragging task), use a shadow with a blur of `32px`, an offset of `y: 8px`, and an opacity of 4% using the `on_surface` color. This mimics natural, ambient light.
*   **The "Ghost Border" Fallback:** If accessibility requires a stroke, use the `outline_variant` token at **15% opacity**. This creates a "Ghost Border" that defines the shape without interrupting the visual flow.

## 5. Components

### Buttons & Chips
*   **Primary Action:** `primary` background with `on_primary` text. Use `roundedness-md` (0.375rem). Apply the "Signature Texture" gradient for a premium finish.
*   **Filter Chips:** Use `secondary_container` with `on_secondary_container` text. When active, shift to `primary_fixed` to indicate selection.

### Task Cards & Lists
*   **The Rule of Space:** Forbid the use of divider lines. Separate tasks using `spacing-4` (1rem) of vertical white space or by placing each task in a `surface_container_lowest` card.
*   **Task State:** Use `tertiary` (#00655c) for completed states and `error` (#ba1a1a) for overdue items. These should be subtle accents (a 4px vertical pill on the card's edge), not the entire background.

### Calendar Grid
*   **Grid Definition:** Instead of lines, define the calendar grid using `surface_container_low` for the "off-days" and `surface` for the current month. The "current day" should use a `primary_container` ring.

### Inputs
*   **Modern Field:** A flat `surface_container_highest` background with a bottom-only "Ghost Border" that expands to a 2px `primary` line on focus.

## 6. Do's and Don'ts

### Do:
*   **Use Asymmetry:** Place your `display-lg` headers slightly off-center or aligned to a different column than your body text to create a custom, high-end layout.
*   **Embrace Negative Space:** Use `spacing-12` and `spacing-16` to let complex data "breathe."
*   **Color as Information:** Use `tertiary` (Teal) only for success/completion to ensure the user’s eye associates that hue with "Done."

### Don't:
*   **Don't use 100% Black:** Always use `on_surface` (#191c1e) for text. Pure black is too harsh for a professional productivity environment.
*   **Don't use Box Shadows on everything:** Rely on background color shifts first. Shadows should be reserved for temporary, floating states.
*   **Don't use 1px Dividers:** If you feel the need to separate two sections, increase the `spacing` or change the `surface_container` tier.