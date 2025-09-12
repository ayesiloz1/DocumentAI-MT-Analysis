# CSS Architecture Documentation

## File Structure

```
src/styles/components/
├── index.css           # Main entry point, imports all components
├── layout.css          # Full-screen layout, main structure
├── navigation.css      # Top bar, navigation elements
├── sidebar.css         # Chat history sidebar
├── messages.css        # Chat bubbles, message styling
├── input.css           # Form inputs, buttons, textarea
└── responsive.css      # Media queries, accessibility
```

## Component Responsibilities

### 📁 **index.css**
- Main entry point that imports all component files
- Global CSS variables and theme definitions
- Utility classes and base styles
- Scrollbar styling

### 📁 **layout.css** 
- `.mt-analyzer-wrapper` - Full-screen container
- `.chat-layout` - Main flex layout
- `.chat-main` - Primary chat interface container
- `.chat-container` - Chat messages container
- `.chat-messages` - Messages area with scrolling

### 📁 **navigation.css**
- `.chat-top-bar` - Header navigation bar
- `.sidebar-toggle-btn` - Hamburger menu button
- `.top-bar-title-section` - App title and subtitle
- `.conversation-counter` - Chat count display
- `.new-chat-btn--compact` - Compact new chat button

### 📁 **sidebar.css**
- `.chat-sidebar` - Main sidebar container with open/closed states
- `.sidebar-header` - Sidebar header with title and close button
- `.new-chat-btn` - Primary new chat button
- `.chat-history-list` - Scrollable chat list
- `.chat-history-item` - Individual chat items with active states
- `.chat-delete-btn` - Delete button with hover effects

### 📁 **messages.css**
- `.message-wrapper` - Message container with animations
- `.message-avatar` - User/AI profile pictures
- `.message-bubble` - Chat bubbles with gradients and shadows
- `.message-content` - Rich text content with markdown support
- `.message-timestamp` - Time display
- `.loading-dots` - Typing indicators

### 📁 **input.css** ⭐ **FIXED TEXTAREA STYLES**
- `.chat-input-container` - Input area container
- `.chat-input-wrapper` - Input form layout
- `.chat-input` - **Fixed textarea with proper styling**
- `.btn-send` - Send button with gradients
- `.btn-document` - Document preview button
- `.btn-file-upload` - File upload button
- `.file-preview` - File attachment preview

### 📁 **responsive.css**
- Mobile breakpoints (768px, 480px)
- Print styles
- High contrast mode support
- Reduced motion preferences
- Dark mode support

## Key Fixes Applied

### ✅ **Fixed Textarea Issues**
1. **Removed dark background** (`rgb(11, 5, 5)` → `#ffffff`)
2. **Eliminated duplicate styles** (consolidated 3 conflicting `.chat-input` definitions)
3. **Improved focus states** with proper blue border and shadow
4. **Enhanced typography** with proper font family and sizing
5. **Added proper disabled states** with visual feedback

### ✅ **Improved Architecture**
1. **Separated concerns** - each file has a specific purpose
2. **Eliminated conflicts** - no more duplicate CSS rules
3. **Better maintainability** - easy to find and edit styles
4. **Improved performance** - organized imports and smaller file sizes
5. **Enhanced readability** - clear structure and naming conventions

## Usage

Import the main CSS file in your components:

```tsx
import '../styles/components/index.css';
```

This automatically includes all component styles in the correct order.

## Benefits

- ✅ **Fixed textarea styling issues**
- ✅ **Eliminated CSS conflicts**
- ✅ **Improved maintainability**
- ✅ **Better organization**
- ✅ **Enhanced performance**
- ✅ **Easier debugging**
- ✅ **Responsive design**
- ✅ **Accessibility support**