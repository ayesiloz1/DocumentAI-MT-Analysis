# 🎨 CSS Classes Quick Reference

## 🔘 Buttons
```css
/* Base Button */
.btn                    /* Base button styles */

/* Button Sizes */
.btn--xs               /* Extra small button */
.btn--sm               /* Small button */
.btn--md               /* Medium button (default) */
.btn--lg               /* Large button */
.btn--xl               /* Extra large button */

/* Button Variants */
.btn--primary          /* Primary action (blue) */
.btn--secondary        /* Secondary action (green) */
.btn--outline          /* Outlined button */
.btn--ghost            /* Minimal button */
.btn--danger           /* Destructive action (red) */
.btn--success          /* Success action (green) */
.btn--warning          /* Warning action (orange) */

/* Special Buttons */
.btn--icon-only        /* Icon-only button (round) */
.btn--fab              /* Floating action button */
.btn--loading          /* Loading state with spinner */
```

## 🃏 Cards
```css
/* Base Card */
.card                  /* Base card styles */

/* Card Variants */
.card--elevated        /* Raised shadow */
.card--flat            /* No shadow */
.card--outlined        /* Outlined border */
.card--success         /* Green left border */
.card--warning         /* Orange left border */
.card--error           /* Red left border */
.card--info            /* Blue left border */

/* Card Parts */
.card-header           /* Card header section */
.card-title            /* Card title text */
.card-subtitle         /* Card subtitle text */
.card-body             /* Main card content */
.card-footer           /* Card footer section */
.card-actions          /* Action buttons area */

/* Card Sizes */
.card--sm              /* Small card (300px max) */
.card--md              /* Medium card (500px max) */
.card--lg              /* Large card (700px max) */
.card--xl              /* Extra large card (900px max) */
.card--full            /* Full width card */

/* Card States */
.card--interactive     /* Hover effects enabled */
.card--loading         /* Loading shimmer effect */
.card--disabled        /* Disabled state */
```

## 📝 Forms
```css
/* Form Layout */
.form                  /* Form container */
.form-group            /* Field group */
.form-row              /* Horizontal field row */
.form-col              /* Column in row */

/* Form Elements */
.form-input            /* Text input */
.form-textarea         /* Textarea */
.form-select           /* Select dropdown */
.form-label            /* Field label */
.form-help             /* Help text */
.form-error            /* Error message */

/* Input Sizes */
.form-input--sm        /* Small input */
.form-input--lg        /* Large input */

/* Validation States */
.form-input--valid     /* Valid state (green) */
.form-input--invalid   /* Invalid state (red) */

/* Checkboxes & Radios */
.form-check            /* Checkbox/radio container */
.form-check-input      /* Checkbox/radio input */
.form-check-label      /* Checkbox/radio label */

/* File Upload */
.form-file             /* File upload container */
.form-file-input       /* Hidden file input */
.form-file-label       /* Visible file label */

/* Input Groups */
.input-group           /* Input with addon */
.input-group-addon     /* Addon (prefix/suffix) */
```

## 💬 Chat Interface
```css
/* Chat Container */
.chat-container        /* Main chat wrapper */
.chat-header           /* Chat header area */
.chat-messages         /* Messages scroll area */
.chat-input-container  /* Input area */

/* Header Elements */
.chat-header-content   /* Header flex container */
.chat-header-icon      /* Header icon */
.chat-header-title     /* Header title */
.chat-header-subtitle  /* Header subtitle */

/* Message Elements */
.message-wrapper       /* Message container */
.message-wrapper--user /* User message alignment */
.message-wrapper--ai   /* AI message alignment */
.message-avatar        /* Message avatar */
.message-bubble        /* Message bubble */
.message-bubble--user  /* User message style */
.message-bubble--ai    /* AI message style */

/* Message Types */
.message-file          /* File upload message */
.message-analysis      /* Analysis result message */
.message-loading       /* Loading indicator */
.message-timestamp     /* Message timestamp */

/* Input Elements */
.chat-input            /* Message input field */
.chat-input-wrapper    /* Input container */
.chat-input-buttons    /* Action buttons */
.btn-send              /* Send button */
.btn-file-upload       /* File upload button */
```

## 📋 MT Analyzer Specific
```css
/* MT Document */
.mt-document           /* Document container */
.mt-document-header    /* Document header */
.mt-document-title     /* Document title */
.mt-document-body      /* Document content */

/* MT Sections */
.mt-section            /* Document section */
.mt-section-title      /* Section title */

/* MT Fields */
.mt-field-group        /* Field grid container */
.mt-field              /* Individual field */
.mt-field-label        /* Field label */
.mt-field-value        /* Field value */
.mt-field-value--highlight /* Highlighted value */

/* MT Status */
.mt-status             /* Status indicator */
.mt-status--required   /* MT Required (red) */
.mt-status--not-required /* MT Not Required (green) */
.mt-status--pending    /* Pending status (orange) */

/* MT Design Types */
.mt-design-type        /* Design type badge */
.mt-design-type--type-1 /* Type I (blue) */
.mt-design-type--type-2 /* Type II (green) */
.mt-design-type--type-3 /* Type III (orange) */

/* MT Analysis */
.mt-analysis-grid      /* Analysis grid layout */
.mt-analysis-card      /* Analysis result card */
.mt-requirement-panel  /* Requirement determination */
.mt-confidence         /* Confidence indicator */
```

## 🛠 Layout Utilities
```css
/* Flexbox */
.flex                  /* display: flex */
.flex-col              /* flex-direction: column */
.flex-row              /* flex-direction: row */
.flex-wrap             /* flex-wrap: wrap */
.flex-1                /* flex: 1 */
.items-center          /* align-items: center */
.justify-between       /* justify-content: space-between */

/* Grid */
.grid                  /* display: grid */
.grid-cols-1           /* 1 column grid */
.grid-cols-2           /* 2 column grid */
.grid-cols-3           /* 3 column grid */
.grid-cols-auto        /* Auto-fit grid */

/* Spacing */
.gap-xs                /* gap: 4px */
.gap-sm                /* gap: 8px */
.gap-md                /* gap: 16px */
.gap-lg                /* gap: 24px */

.p-xs, .p-sm, .p-md    /* Padding (all sides) */
.pt-xs, .pr-sm, .pb-md /* Padding (specific sides) */
.m-xs, .m-sm, .m-md    /* Margin (all sides) */
.mt-xs, .mr-sm, .mb-md /* Margin (specific sides) */
```

## 🎨 Color Utilities
```css
/* Text Colors */
.text-primary          /* Primary blue text */
.text-secondary        /* Secondary green text */
.text-success          /* Success green text */
.text-warning          /* Warning orange text */
.text-error            /* Error red text */
.text-gray-500         /* Gray text (various shades) */

/* Background Colors */
.bg-primary            /* Primary blue background */
.bg-secondary          /* Secondary green background */
.bg-white              /* White background */
.bg-gray-50            /* Light gray background */
.bg-gray-100           /* Slightly darker gray */
```

## 📐 Size & Display
```css
/* Width & Height */
.w-full                /* width: 100% */
.h-full                /* height: 100% */
.min-h-screen          /* min-height: 100vh */

/* Display */
.hidden                /* display: none */
.block                 /* display: block */
.inline-block          /* display: inline-block */

/* Position */
.relative              /* position: relative */
.absolute              /* position: absolute */
.fixed                 /* position: fixed */
```

## 📱 Responsive Classes
```css
/* Mobile-first breakpoints */
@media (max-width: 768px) {
  .md-hidden           /* Hidden on tablet and up */
}

@media (max-width: 480px) {
  .sm-hidden           /* Hidden on mobile */
}
```

## 🎯 Usage Examples

### Complete Button
```html
<button class="btn btn--primary btn--lg">
  Large Primary Button
</button>
```

### MT Status Card
```html
<div class="card card--elevated mt-analysis-card">
  <div class="card-header">
    <h3 class="card-title">MT Analysis Result</h3>
  </div>
  <div class="card-body">
    <div class="mt-status mt-status--required">
      MT Required: YES
    </div>
  </div>
</div>
```

### Chat Message
```html
<div class="message-wrapper message-wrapper--ai">
  <div class="message-avatar message-avatar--ai">
    <BotIcon />
  </div>
  <div class="message-bubble message-bubble--ai">
    AI response content here
  </div>
</div>
```

### Layout with Utilities
```html
<div class="flex items-center justify-between p-lg bg-white rounded-lg shadow">
  <h2 class="text-lg font-semibold text-gray-900">Title</h2>
  <button class="btn btn--outline btn--sm">Action</button>
</div>
```
