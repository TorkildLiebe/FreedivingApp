# Tailwind Color Configuration

## Color Choices

- **Primary:** `emerald` — Used for buttons, links, key accents, active states, FAB
- **Secondary:** `teal` — Used for secondary actions (e.g. "Add Dive" button), visibility badges, parking markers
- **Neutral:** `stone` — Used for backgrounds, text, borders, frosted glass panels

## Usage Examples

**Primary button:**
```
bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white
```

**Secondary button:**
```
bg-teal-600 hover:bg-teal-700 text-white
```

**Active nav tab:**
```
text-emerald-500 dark:text-emerald-400
```

**Visibility badge:**
```
text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30
```

**Frosted glass panel:**
```
bg-white/80 dark:bg-stone-900/85 backdrop-blur-md border border-stone-200/60 dark:border-stone-700/60
```

**Neutral text:**
```
text-stone-900 dark:text-stone-100        /* primary */
text-stone-600 dark:text-stone-400        /* secondary */
text-stone-400 dark:text-stone-500        /* muted */
```

**Neutral background:**
```
bg-stone-50 dark:bg-stone-950            /* page */
bg-stone-100 dark:bg-stone-900           /* surface */
bg-white dark:bg-stone-900               /* card */
```

## Notes

- The app is **mobile-first** with a fullscreen map. All UI chrome should use frosted glass to keep the map visible.
- Use `emerald` for the primary accent throughout — active states, CTAs, form focus rings.
- Use `teal` for secondary interactive elements (dive-related actions, secondary badges).
- `stone` serves as the warm-gray neutral system for all text, borders, and backgrounds.
