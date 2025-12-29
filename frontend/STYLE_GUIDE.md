# Style Guide

This document outlines the design system, color palette, typography, and component styling guidelines for the Cardio-Sense frontend.

## Color Palette

### Primary Colors
- **Primary Light**: `#E3F2FD` - Used for backgrounds and hover states
- **Primary Default**: `#2196F3` - Main brand color for buttons, links, and accents
- **Primary Dark**: `#1565C0` - Used for hover states and emphasis

### Secondary Colors
- **Secondary Light**: `#F5F5F5` - Light backgrounds
- **Secondary Default**: `#757575` - Secondary text
- **Secondary Dark**: `#424242` - Dark text

### Semantic Colors
- **Success**: `#10B981` (green-500) - Success states, verified status
- **Warning**: `#F59E0B` (yellow-500) - Warnings, pending states
- **Error**: `#EF4444` (red-500) - Errors, validation messages
- **Info**: `#3B82F6` (blue-500) - Informational messages

### Neutral Colors
- **White**: `#FFFFFF`
- **Gray 50**: `#F9FAFB` - Page backgrounds
- **Gray 100**: `#F3F4F6` - Card backgrounds
- **Gray 200**: `#E5E7EB` - Borders
- **Gray 300**: `#D1D5DB` - Input borders
- **Gray 600**: `#4B5563` - Secondary text
- **Gray 900**: `#111827` - Primary text

## Typography

### Font Family
- **Primary**: `Inter, system-ui, sans-serif`
- **Fallback**: System fonts for better performance

### Font Sizes
- **xs**: `0.75rem` (12px) - Small labels, captions
- **sm**: `0.875rem` (14px) - Body text, descriptions
- **base**: `1rem` (16px) - Default body text
- **lg**: `1.125rem` (18px) - Large body text
- **xl**: `1.25rem` (20px) - Section headings
- **2xl**: `1.5rem` (24px) - Page subheadings
- **3xl**: `1.875rem` (30px) - Page titles
- **4xl**: `2.25rem` (36px) - Hero headings

### Font Weights
- **Normal**: `400` - Body text
- **Medium**: `500` - Buttons, emphasis
- **Semibold**: `600` - Headings
- **Bold**: `700` - Strong emphasis

## Spacing

### Scale (Tailwind default)
- `1` = 0.25rem (4px)
- `2` = 0.5rem (8px)
- `4` = 1rem (16px)
- `6` = 1.5rem (24px)
- `8` = 2rem (32px)
- `12` = 3rem (48px)
- `16` = 4rem (64px)

### Common Spacing Patterns
- **Component padding**: `p-4` to `p-6` (16px - 24px)
- **Section spacing**: `py-8` to `py-16` (32px - 64px)
- **Card spacing**: `p-6` (24px)
- **Input spacing**: `px-4 py-2` (16px horizontal, 8px vertical)
- **Button padding**: `px-6 py-2` (24px horizontal, 8px vertical)

## Components

### Buttons

**Primary Button**:
```jsx
<Button variant="primary">Click Me</Button>
```
- Background: Primary Default
- Text: White
- Hover: Primary Dark
- Focus: Ring with Primary Default

**Secondary Button**:
```jsx
<Button variant="secondary">Click Me</Button>
```
- Background: White
- Text: Primary Default
- Border: Primary Default (2px)
- Hover: Primary Light background

### Input Fields

**Standard Input**:
```jsx
<Input label="Email" type="email" required />
```
- Border: Gray 300
- Focus: Primary Default ring
- Error state: Red border and text

### Cards

**Standard Card**:
- Background: White
- Border radius: `rounded-lg` (8px)
- Shadow: `shadow-md`
- Padding: `p-6` (24px)

**Hover Card**:
- Add `hover:shadow-lg` for elevation

### Navigation

**Navbar**:
- Background: White
- Shadow: `shadow-md`
- Height: `h-16` (64px)
- Padding: Horizontal `px-4 sm:px-6 lg:px-8`

**Sidebar** (if used):
- Background: White or Gray 50
- Width: `w-64` (256px)
- Padding: `p-4`

## Layout

### Container
- Max width: `max-w-7xl` (1280px)
- Centered: `mx-auto`
- Padding: `px-4 sm:px-6 lg:px-8`

### Grid System
- **2 columns**: `grid-cols-1 md:grid-cols-2`
- **3 columns**: `grid-cols-1 md:grid-cols-3`
- **4 columns**: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`
- Gap: `gap-4` to `gap-6` (16px - 24px)

## Responsive Breakpoints

- **sm**: 640px - Small tablets
- **md**: 768px - Tablets
- **lg**: 1024px - Desktops
- **xl**: 1280px - Large desktops

### Mobile-First Approach
Always design for mobile first, then add larger breakpoint styles:
```jsx
className="text-sm md:text-base lg:text-lg"
```

## Accessibility

### Focus States
- All interactive elements must have visible focus states
- Use `focus:ring-2 focus:ring-primary-DEFAULT focus:ring-offset-2`

### Color Contrast
- Text on white: Minimum contrast ratio 4.5:1
- Primary buttons: White text on Primary Default (meets WCAG AA)

### ARIA Labels
- Use proper labels for form inputs
- Add `aria-label` for icon-only buttons
- Use semantic HTML elements

## Animation & Transitions

### Transitions
- **Default**: `transition-colors` (150ms)
- **Hover**: `hover:bg-primary-dark`
- **Focus**: Instant ring appearance

### Loading States
- Use spinner: `animate-spin` with circular border
- Skeleton loaders for content placeholders

## Icons

- Use SVG icons for scalability
- Size: `w-5 h-5` (20px) for inline, `w-6 h-6` (24px) for standalone
- Color: Inherit from text color or use semantic colors

## Forms

### Form Layout
- Vertical spacing: `space-y-4` between fields
- Required fields: Red asterisk (`*`)
- Error messages: Red text below input
- Success states: Green checkmark or text

### Validation
- Real-time validation on blur
- Show errors inline
- Disable submit button until valid

## Tailwind Configuration

The project uses a custom Tailwind configuration with extended colors:

```javascript
colors: {
  primary: {
    light: '#E3F2FD',
    DEFAULT: '#2196F3',
    dark: '#1565C0',
  },
  // ...
}
```

## Best Practices

1. **Consistency**: Use predefined components and utilities
2. **Responsive**: Always test on mobile, tablet, and desktop
3. **Accessibility**: Ensure keyboard navigation and screen reader support
4. **Performance**: Use Tailwind's purge to remove unused styles
5. **Maintainability**: Keep component styles in Tailwind classes, avoid inline styles

## Examples

### Page Layout
```jsx
<div className="min-h-screen bg-gray-50">
  <Navbar />
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {/* Content */}
  </div>
</div>
```

### Card Grid
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {items.map(item => (
    <div className="card hover:shadow-lg transition-shadow">
      {/* Card content */}
    </div>
  ))}
</div>
```

