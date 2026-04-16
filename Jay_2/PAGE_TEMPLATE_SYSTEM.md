# Page Template System

## Overview

The Page Template System is a powerful feature that allows you to create, manage, and generate complete web pages with pre-built sections, customizable themes, and seamless form integration. This system is designed to work alongside the Dynamic Form System to provide a complete solution for building modern web applications.

## Features

### 🎨 **Pre-built Page Layouts**
- **Landing Page Template**: Hero section, features, contact form, CTA, footer
- **Contact Page Template**: Hero, about section, contact form, footer
- **About Page Template**: Hero, story content, values, testimonials, footer
- **Custom Templates**: Create your own templates from scratch

### 🧩 **Customizable Sections**
- **Hero Section**: Main banner with title, subtitle, and call-to-action
- **Features Section**: Showcase key features or services in a grid layout
- **Form Section**: Embed dynamic forms with automatic integration
- **Content Section**: Rich text content with customizable styling
- **Testimonials Section**: Customer reviews and ratings
- **Call-to-Action Section**: Action-oriented sections with buttons
- **Footer Section**: Page footer with links and company information

### 🎨 **Theme Configuration**
- **Color Scheme**: Primary, secondary, background, and text colors
- **Typography**: Font family selection (Inter, Roboto, Open Sans, etc.)
- **Border Radius**: Customizable border radius for elements
- **Spacing**: Consistent spacing throughout the page
- **Responsive Design**: Mobile-first responsive layouts

### ⚡ **Auto-generation**
- **Code Generation**: Generate React/Next.js code from templates
- **Form Integration**: Automatic integration with dynamic forms
- **Theme Application**: Global theme styles applied automatically
- **Responsive Preview**: Preview templates in desktop, tablet, and mobile views

## How to Use

### 1. Accessing the Template Builder

1. Navigate to the Jay_2 section in your application
2. Click on the "Page Templates" tab
3. You'll see the Page Template Builder interface

### 2. Creating a New Template

1. Click "New Template" button
2. Fill in the basic information:
   - **Template Name**: Give your template a descriptive name
   - **Category**: Choose from General, Landing, Contact, About, or Services
   - **Description**: Add a brief description of the template's purpose

### 3. Adding Sections

1. Select your template from the left sidebar
2. In the "Sections" area, click on any section type to add it:
   - **Hero**: Main banner section
   - **Features**: Feature showcase
   - **Form**: Dynamic form integration
   - **Content**: Rich text content
   - **Testimonials**: Customer reviews
   - **CTA**: Call-to-action section
   - **Footer**: Page footer

### 4. Configuring Sections

Each section has its own configuration options:

#### Hero Section
- **Title**: Main headline
- **Subtitle**: Supporting text
- **CTA Text**: Call-to-action button text
- **CTA Link**: Button destination URL
- **Background Image**: Optional background image URL
- **Height**: Section height (e.g., "600px")
- **Alignment**: Text alignment (left, center, right)

#### Features Section
- **Title**: Section headline
- **Subtitle**: Supporting text
- **Features**: Array of feature objects with:
  - `title`: Feature name
  - `description`: Feature description
  - `icon`: Emoji or icon
- **Columns**: Number of columns (1-4)
- **Layout**: Grid or list layout

#### Form Section
- **Form ID**: ID of the dynamic form to embed
- **Title**: Section headline
- **Subtitle**: Supporting text
- **Background**: Light or dark background
- **Width**: Full width or container width

#### Content Section
- **Title**: Section headline
- **Content**: HTML content (supports rich text)
- **Width**: Container or full width
- **Padding**: Small, medium, or large padding

### 5. Customizing Themes

1. Click the "Theme" button in the template editor
2. Configure the following options:
   - **Primary Color**: Main brand color
   - **Secondary Color**: Supporting color
   - **Background Color**: Page background
   - **Text Color**: Main text color
   - **Font Family**: Typography choice
   - **Border Radius**: Element border radius

### 6. Previewing Templates

1. Click the "Generate Code" button
2. Use the preview modal to see your template in action
3. Switch between desktop, tablet, and mobile views
4. Test form functionality if included

### 7. Exporting and Importing

#### Exporting Templates
1. Select a template from the list
2. Click the download icon (📥)
3. Template will be saved as a JSON file

#### Importing Templates
1. Click the "Import" button
2. Select a JSON template file
3. Template will be added to your collection

### 8. Generating Code

1. Click "Generate Code" in the template editor
2. The system will generate React/Next.js code
3. Copy the code and use it in your application
4. The generated code includes:
   - Form integration
   - Theme application
   - Responsive design
   - Error handling
   - Loading states

## Integration with Dynamic Forms

The Page Template System seamlessly integrates with the Dynamic Form System:

### Automatic Form Loading
- Templates can include form sections that automatically load form data
- Forms are rendered using the `DynamicForm` component
- Form submissions are handled automatically

### Form Configuration
- Specify the form ID in the form section configuration
- The system will load the form data and render it
- Form submissions use the same submission handler as standalone forms

### Success/Error Handling
- Templates include automatic success and error message handling
- Uses the same `AutoSuccessMessage` and `AutoErrorMessage` components
- Consistent user experience across the application

## Template Categories

### Landing Page
- Hero section with compelling headline
- Feature showcase
- Contact form
- Call-to-action section
- Footer with links

### Contact Page
- Hero section
- About/company information
- Contact form
- Footer

### About Page
- Hero section
- Company story/content
- Core values
- Testimonials
- Footer

### Services Page
- Hero section
- Service descriptions
- Pricing information
- Contact form
- Footer

## Best Practices

### 1. Template Organization
- Use descriptive names for templates
- Categorize templates appropriately
- Add detailed descriptions for team members

### 2. Section Configuration
- Keep hero sections concise and compelling
- Use consistent styling across sections
- Ensure proper spacing between sections

### 3. Theme Consistency
- Choose colors that match your brand
- Use readable font combinations
- Maintain consistent border radius values

### 4. Form Integration
- Test form functionality in preview mode
- Ensure form IDs are correct
- Verify submission handling works properly

### 5. Responsive Design
- Preview templates on different screen sizes
- Ensure content is readable on mobile devices
- Test form usability on touch devices

## Technical Details

### Template Structure
```json
{
  "id": "unique_template_id",
  "name": "Template Name",
  "description": "Template description",
  "category": "landing|contact|about|services|general",
  "sections": [
    {
      "id": "section_id",
      "type": "hero|features|form|content|testimonials|cta|footer",
      "name": "Section Name",
      "config": {
        // Section-specific configuration
      },
      "order": 0
    }
  ],
  "theme": {
    "primaryColor": "#3B82F6",
    "secondaryColor": "#6B7280",
    "backgroundColor": "#FFFFFF",
    "textColor": "#1F2937",
    "fontFamily": "Inter",
    "borderRadius": "8px",
    "spacing": "medium"
  },
  "settings": {
    "responsive": true,
    "seoOptimized": true,
    "loadAnimation": true,
    "customCSS": ""
  },
  "metadata": {
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z",
    "version": "1.0.0",
    "author": "System"
  }
}
```

### Generated Code Structure
The system generates React/Next.js components that include:
- State management for forms
- Loading and error states
- Form submission handling
- Theme application
- Responsive design
- SEO optimization

### File Storage
- Templates are stored in localStorage by default
- Can be exported/imported as JSON files
- Future integration with backend API planned

## Future Enhancements

### Planned Features
1. **Backend Integration**: Store templates in database
2. **Template Marketplace**: Share and discover templates
3. **Advanced Theming**: CSS custom properties and advanced styling
4. **Animation Support**: Built-in animations and transitions
5. **SEO Tools**: Meta tags and structured data
6. **Analytics Integration**: Built-in analytics tracking
7. **A/B Testing**: Template variation testing
8. **Collaboration**: Team template sharing and editing

### Custom Section Types
1. **Gallery Section**: Image galleries and portfolios
2. **Pricing Section**: Pricing tables and plans
3. **Team Section**: Team member profiles
4. **Blog Section**: Blog post listings
5. **FAQ Section**: Frequently asked questions
6. **Map Section**: Location and contact maps

## Troubleshooting

### Common Issues

#### Template Not Loading
- Check if template JSON is valid
- Verify all required fields are present
- Clear browser cache and try again

#### Form Not Rendering
- Ensure form ID is correct
- Check if form exists in the system
- Verify form data is properly loaded

#### Theme Not Applying
- Check color values are valid hex codes
- Ensure font family is available
- Verify CSS custom properties are working

#### Preview Not Working
- Check browser console for errors
- Ensure all dependencies are loaded
- Try refreshing the page

### Getting Help
- Check the browser console for error messages
- Verify all form IDs and configurations
- Test with sample templates first
- Contact support if issues persist

## Conclusion

The Page Template System provides a powerful and flexible way to create professional web pages with minimal effort. By combining pre-built sections, customizable themes, and seamless form integration, you can quickly build modern, responsive web applications that provide an excellent user experience.

The system is designed to be extensible and can be easily customized to meet your specific needs. Whether you're building a simple contact page or a complex landing page, the Page Template System has you covered.
