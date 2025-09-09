# MT Analyzer Frontend CSS Architecture

## 📁 CSS File Structure

```
src/styles/
├── index.css           # Main entry point (imports all modules)
├── variables.css       # CSS custom properties & design tokens
├── utilities.css       # Utility classes (layout, spacing, colors)
├── buttons.css         # Button component styles
├── cards.css          # Card component styles
├── forms.css          # Form component styles
├── chat.css           # Chat interface specific styles
└── mt-analyzer.css    # MT document & analysis specific styles
```

## 🎨 Design System

### Color Palette
- **Primary**: Blue spectrum (#3b82f6 family)
- **Secondary**: Green spectrum (#22c55e family)
- **Status Colors**: Success, Warning, Error, Info
- **Grays**: 50-900 scale for neutral elements

### Typography
- **Font Sizes**: xs (12px) → 4xl (36px)
- **Font Weights**: normal (400) → bold (700)
- **Line Heights**: tight (1.25) → relaxed (1.75)

### Spacing System
- **Scale**: xs (4px) → 3xl (64px)
- **Consistent**: All components use the same spacing tokens

### Border & Shadows
- **Radius**: sm (6px) → xl (16px) + full (999px)
- **Shadows**: sm → xl with consistent elevation
- **Borders**: thin (1px) → thick (4px)

## 🔧 Customization Guide

### 1. Changing Colors
Edit `variables.css` to modify the color palette:

```css
:root {
  /* Change primary brand color */
  --color-primary-500: #your-brand-color;
  --color-primary-600: #darker-shade;
  
  /* Status colors */
  --color-success-500: #your-success-color;
  --color-warning-500: #your-warning-color;
  --color-error-500: #your-error-color;
}
```

### 2. Typography Changes
Modify font settings in `variables.css`:

```css
:root {
  /* Font sizes */
  --font-size-base: 1rem;        /* Base font size */
  --font-size-lg: 1.125rem;      /* Larger text */
  
  /* Font weights */
  --font-weight-normal: 400;
  --font-weight-semibold: 600;
}
```

### 3. Spacing Adjustments
Update spacing scale in `variables.css`:

```css
:root {
  --spacing-sm: 0.5rem;    /* 8px */
  --spacing-md: 1rem;      /* 16px */
  --spacing-lg: 1.5rem;    /* 24px */
}
```

### 4. Component Customization

#### Chat Interface
- Modify `chat.css` for message styling
- Change bubble colors, spacing, animations

#### MT Documents
- Edit `mt-analyzer.css` for document appearance
- Customize status indicators, field layouts

#### Buttons & Cards
- Update `buttons.css` and `cards.css`
- Modify hover effects, sizes, variants

## 🚀 Usage Examples

### Using CSS Classes in Components

```tsx
// Button examples
<button className="btn btn--primary btn--lg">
  Primary Large Button
</button>

<button className="btn btn--outline btn--sm">
  Small Outline Button
</button>

// Card examples
<div className="card card--elevated">
  <div className="card-header">
    <h3 className="card-title">Card Title</h3>
  </div>
  <div className="card-body">
    Card content here
  </div>
</div>

// Utility classes
<div className="flex items-center gap-md p-lg bg-gray-50 rounded-lg">
  Flexbox container with utilities
</div>

// MT-specific classes
<div className="mt-document">
  <div className="mt-document-header">
    <h1 className="mt-document-title">MT Analysis</h1>
  </div>
  <div className="mt-document-body">
    <div className="mt-section">
      <h2 className="mt-section-title">Analysis Results</h2>
      <div className="mt-field-group">
        <div className="mt-field">
          <label className="mt-field-label">MT Required</label>
          <div className="mt-field-value mt-field-value--highlight">
            YES
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

## 🎯 Component Class Patterns

### Button Variations
- `btn btn--primary`: Primary action button
- `btn btn--outline`: Outlined button
- `btn btn--ghost`: Minimal button
- `btn btn--danger`: Destructive action
- `btn btn--sm/md/lg/xl`: Size variants

### Card Variations
- `card card--elevated`: Raised shadow
- `card card--flat`: No shadow
- `card card--success/warning/error`: Status cards
- `card card--interactive`: Hover effects

### Status Indicators
- `mt-status--required`: Red status (MT required)
- `mt-status--not-required`: Green status (MT not required)
- `mt-status--pending`: Yellow status (pending review)

### Layout Utilities
- `flex`, `grid`: Display modes
- `items-center`, `justify-between`: Alignment
- `gap-sm/md/lg`: Spacing between items
- `p-md`, `m-lg`: Padding/margin
- `bg-gray-50`, `text-primary`: Colors

## 🌙 Dark Mode Support
The system includes CSS custom properties that automatically adapt to `prefers-color-scheme: dark`. To override:

```css
[data-theme="dark"] {
  --color-gray-50: #1f2937;
  --color-gray-900: #ffffff;
  /* ... other dark theme overrides */
}
```

## 📱 Responsive Design
All components include mobile-first responsive design:

- Breakpoints: 768px (tablet), 480px (mobile)
- Components automatically stack on smaller screens
- Grid layouts become single-column
- Padding/margins adjust for mobile

## 🛠 Development Tips

1. **Use CSS Variables**: Always reference `var(--color-primary-500)` instead of hardcoded colors
2. **Consistent Spacing**: Use the spacing scale (`var(--spacing-md)`) instead of arbitrary values
3. **Component Modifiers**: Use BEM-style modifiers like `btn--primary`, `card--elevated`
4. **Utility First**: Combine utility classes for quick styling: `flex items-center gap-md`
5. **Theme-Aware**: Colors automatically adapt to light/dark themes

## 🔄 Future Enhancements

To add new components or modify existing ones:

1. **New Component**: Create `new-component.css` and import in `index.css`
2. **Color Scheme**: Add new color variables in `variables.css`
3. **Utility Class**: Add to `utilities.css` following the naming convention
4. **Responsive**: Always include mobile-first media queries

This modular system makes it easy to maintain, customize, and extend the frontend styling while keeping everything organized and consistent.
