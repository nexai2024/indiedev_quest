import { db } from "@/config/db";
import { CourseChaptersTable } from "@/config/schema";
import { NextRequest, NextResponse } from "next/server";

// --- 1. HTML COURSE DATA ---
const HTML_CHAPTERS = [
    {
        "id": 1,
        "name": "Introduction to HTML",
        "desc": "Discover the foundation of every webpage and learn how HTML shapes the digital world.",
        "exercises": [
            { "name": "Explore the Web Skeleton", "slug": "explore-the-web-skeleton", "xp": 20, "difficulty": "easy" },
            { "name": "Build Your Base Camp", "slug": "build-your-base-camp", "xp": 25, "difficulty": "easy" },
            { "name": "Name Your World", "slug": "name-your-world", "xp": 15, "difficulty": "easy" },
            { "name": "Break & Repair", "slug": "break-and-repair", "xp": 20, "difficulty": "easy" },
            { "name": "HTML Detective", "slug": "html-detective", "xp": 20, "difficulty": "easy" },
            { "name": "Element Collector", "slug": "element-collector", "xp": 25, "difficulty": "easy" }
        ]
    },
    {
        "id": 2,
        "name": "HTML Boilerplate",
        "desc": "Understand the core structure that every HTML document begins with.",
        "exercises": [
            { "name": "Build the Core Structure", "slug": "build-the-core-structure", "xp": 35, "difficulty": "medium" },
            { "name": "Fix the Broken Blueprint", "slug": "fix-the-broken-blueprint", "xp": 30, "difficulty": "easy" },
            { "name": "Boost Meta Power", "slug": "boost-meta-power", "xp": 20, "difficulty": "easy" },
            { "name": "Add Language Identity", "slug": "add-language-identity", "xp": 10, "difficulty": "easy" },
            { "name": "Viewport Setup", "slug": "viewport-setup", "xp": 20, "difficulty": "easy" },
            { "name": "Author Credit", "slug": "author-credit", "xp": 15, "difficulty": "easy" }
        ]
    },
    {
        "id": 3,
        "name": "Head & Body Tags",
        "desc": "Learn the difference between behind-the-scenes metadata and visible page content.",
        "exercises": [
            { "name": "Mind vs Body", "slug": "mind-vs-body", "xp": 20, "difficulty": "easy" },
            { "name": "Activate Styles", "slug": "activate-styles", "xp": 30, "difficulty": "medium" },
            { "name": "Display Your Content", "slug": "display-your-content", "xp": 15, "difficulty": "easy" },
            { "name": "Add External Script", "slug": "add-external-script", "xp": 20, "difficulty": "easy" },
            { "name": "Meta Collection", "slug": "meta-collection", "xp": 25, "difficulty": "easy" },
            { "name": "Body Structure Challenge", "slug": "body-structure-challenge", "xp": 25, "difficulty": "easy" }
        ]
    },
    {
        "id": 4,
        "name": "Text Formatting",
        "desc": "Format your content with headings, paragraphs, bold, italic, and more.",
        "exercises": [
            { "name": "Create the Text Realm", "slug": "create-the-text-realm", "xp": 30, "difficulty": "easy" },
            { "name": "Power Words", "slug": "power-words", "xp": 20, "difficulty": "easy" },
            { "name": "Build a Story Block", "slug": "build-a-story-block", "xp": 30, "difficulty": "medium" },
            { "name": "Line Break Mastery", "slug": "line-break-mastery", "xp": 15, "difficulty": "easy" },
            { "name": "Quote Chamber", "slug": "quote-chamber", "xp": 25, "difficulty": "easy" },
            { "name": "Code Snippet Display", "slug": "code-snippet-display", "xp": 30, "difficulty": "medium" }
        ]
    },
    {
        "id": 5,
        "name": "Links & Navigation",
        "desc": "Create portals between pages and build simple navigation.",
        "exercises": [
            { "name": "Create a Warp Gate", "slug": "create-a-warp-gate", "xp": 20, "difficulty": "easy" },
            { "name": "Open a New Dimension", "slug": "open-a-new-dimension", "xp": 25, "difficulty": "easy" },
            { "name": "Navigation Builder", "slug": "navigation-builder", "xp": 40, "difficulty": "medium" },
            { "name": "Anchor Teleport", "slug": "anchor-teleport", "xp": 20, "difficulty": "easy" },
            { "name": "Email Portal", "slug": "email-portal", "xp": 20, "difficulty": "easy" },
            { "name": "Button Link Trick", "slug": "button-link-trick", "xp": 25, "difficulty": "medium" }
        ]
    },
    {
        "id": 6,
        "name": "Images",
        "desc": "Display images, control sizing, and optimize accessibility.",
        "exercises": [
            { "name": "Summon an Image", "slug": "summon-an-image", "xp": 20, "difficulty": "easy" },
            { "name": "Vision for All", "slug": "vision-for-all", "xp": 15, "difficulty": "easy" },
            { "name": "Image Grid Challenge", "slug": "image-grid-challenge", "xp": 35, "difficulty": "medium" },
            { "name": "Resize Hero", "slug": "resize-hero", "xp": 20, "difficulty": "easy" },
            { "name": "Caption Creator", "slug": "caption-creator", "xp": 25, "difficulty": "medium" },
            { "name": "Broken Image Test", "slug": "broken-image-test", "xp": 15, "difficulty": "easy" }
        ]
    },
    {
        "id": 7,
        "name": "Lists",
        "desc": "Structure grouped information using ordered, unordered, and description lists.",
        "exercises": [
            { "name": "Bullet Creator", "slug": "bullet-creator", "xp": 20, "difficulty": "easy" },
            { "name": "Number Builder", "slug": "number-builder", "xp": 20, "difficulty": "easy" },
            { "name": "Nested List Challenge", "slug": "nested-list-challenge", "xp": 35, "difficulty": "medium" },
            { "name": "Description Vault", "slug": "description-vault", "xp": 25, "difficulty": "easy" },
            { "name": "Task Checklist", "slug": "task-checklist", "xp": 20, "difficulty": "easy" },
            { "name": "Navigation with Lists", "slug": "navigation-with-lists", "xp": 35, "difficulty": "medium" }
        ]
    },
    {
        "id": 8,
        "name": "Tables",
        "desc": "Represent information in structured grid format.",
        "exercises": [
            { "name": "Table Blueprint", "slug": "table-blueprint", "xp": 30, "difficulty": "medium" },
            { "name": "Add Column Headers", "slug": "add-column-headers", "xp": 20, "difficulty": "easy" },
            { "name": "Merge the Cells", "slug": "merge-the-cells", "xp": 35, "difficulty": "medium" },
            { "name": "Student Report Table", "slug": "student-report-table", "xp": 25, "difficulty": "easy" },
            { "name": "Border Styling", "slug": "border-styling", "xp": 20, "difficulty": "easy" },
            { "name": "Header Footer Rows", "slug": "header-footer-rows", "xp": 30, "difficulty": "medium" }
        ]
    },
    {
        "id": 9,
        "name": "Forms Basics",
        "desc": "Collect user input using form controls like input, labels, and buttons.",
        "exercises": [
            { "name": "Create a Login Portal", "slug": "create-a-login-portal", "xp": 40, "difficulty": "medium" },
            { "name": "Design a Contact Form", "slug": "design-a-contact-form", "xp": 45, "difficulty": "medium" },
            { "name": "Placeholder Magic", "slug": "placeholder-magic", "xp": 15, "difficulty": "easy" },
            { "name": "Label Linker", "slug": "label-linker", "xp": 20, "difficulty": "easy" },
            { "name": "Choose Wisely", "slug": "choose-wisely", "xp": 25, "difficulty": "easy" },
            { "name": "Dropdown Selector", "slug": "dropdown-selector", "xp": 30, "difficulty": "medium" }
        ]
    },
    {
        "id": 10,
        "name": "Semantic HTML",
        "desc": "Use meaningful HTML elements to improve page structure and accessibility.",
        "exercises": [
            { "name": "Build the Layout", "slug": "build-the-layout", "xp": 35, "difficulty": "medium" },
            { "name": "Blog Structure", "slug": "blog-structure", "xp": 40, "difficulty": "medium" },
            { "name": "Sidebar Creator", "slug": "sidebar-creator", "xp": 25, "difficulty": "easy" },
            { "name": "Navigation Map", "slug": "navigation-map", "xp": 35, "difficulty": "medium" },
            { "name": "Figure & Caption", "slug": "figure-and-caption", "xp": 25, "difficulty": "easy" },
            { "name": "Semantic Rebuild", "slug": "semantic-rebuild", "xp": 40, "difficulty": "medium" }
        ]
    },
    {
        "id": 11,
        "name": "Audio & Video",
        "desc": "Add multimedia components for richer experiences.",
        "exercises": [
            { "name": "Play the Sound", "slug": "play-the-sound", "xp": 25, "difficulty": "easy" },
            { "name": "Video Portal", "slug": "video-portal", "xp": 30, "difficulty": "medium" },
            { "name": "Autoplay Test", "slug": "autoplay-test", "xp": 20, "difficulty": "easy" },
            { "name": "Add Subtitles", "slug": "add-subtitles", "xp": 40, "difficulty": "medium" },
            { "name": "Audio Playlist", "slug": "audio-playlist", "xp": 30, "difficulty": "easy" },
            { "name": "Thumbnail Setup", "slug": "thumbnail-setup", "xp": 25, "difficulty": "easy" }
        ]
    },
    {
        "id": 12,
        "name": "HTML Best Practices",
        "desc": "Write clear, clean, and accessible HTML optimized for real-world use.",
        "exercises": [
            { "name": "Code Cleanup", "slug": "code-cleanup", "xp": 20, "difficulty": "easy" },
            { "name": "Accessibility Upgrade", "slug": "accessibility-upgrade", "xp": 35, "difficulty": "medium" },
            { "name": "Alt Text Review", "slug": "alt-text-review", "xp": 20, "difficulty": "easy" },
            { "name": "Heading Order Fix", "slug": "heading-order-fix", "xp": 25, "difficulty": "easy" },
            { "name": "Link Check", "slug": "link-check", "xp": 20, "difficulty": "easy" },
            { "name": "Semantic Improvement", "slug": "semantic-improvement", "xp": 30, "difficulty": "medium" }
        ]
    }
];

// --- 2. REACT COURSE DATA ---
const REACT_CHAPTERS = [
    {
        "id": 1,
        "name": "Introduction to React",
        "desc": "Understand what React is, how it works, and write your first JSX code.",
        "exercises": [
            { "name": "Hello World in React", "slug": "hello-world-in-react", "xp": 20, "difficulty": "easy" },
            { "name": "JSX Basics", "slug": "jsx-basics", "xp": 25, "difficulty": "easy" },
            { "name": "Expressions in JSX", "slug": "expressions-in-jsx", "xp": 15, "difficulty": "easy" },
            { "name": "React vs JS", "slug": "react-vs-js", "xp": 20, "difficulty": "easy" },
            { "name": "Closing Tags Rule", "slug": "closing-tags-rule", "xp": 20, "difficulty": "easy" },
            { "name": "Rendering Elements", "slug": "rendering-elements", "xp": 25, "difficulty": "easy" }
        ]
    },
    {
        "id": 2,
        "name": "React Components",
        "desc": "Learn how to split the UI into independent, reusable pieces called components.",
        "exercises": [
            { "name": "First Functional Component", "slug": "first-functional-component", "xp": 35, "difficulty": "medium" },
            { "name": "Import & Export", "slug": "import-and-export", "xp": 30, "difficulty": "easy" },
            { "name": "Parent & Child", "slug": "parent-and-child", "xp": 20, "difficulty": "easy" },
            { "name": "Component Purity", "slug": "component-purity", "xp": 15, "difficulty": "medium" },
            { "name": "Organizing Components", "slug": "organizing-components", "xp": 20, "difficulty": "easy" },
            { "name": "Return Single Root", "slug": "return-single-root", "xp": 15, "difficulty": "easy" }
        ]
    },
    {
        "id": 3,
        "name": "Props (Properties)",
        "desc": "Learn how to pass data from parent components to child components.",
        "exercises": [
            { "name": "Passing Props", "slug": "passing-props", "xp": 20, "difficulty": "easy" },
            { "name": "Reading Props", "slug": "reading-props", "xp": 30, "difficulty": "medium" },
            { "name": "Default Props", "slug": "default-props", "xp": 15, "difficulty": "easy" },
            { "name": "Destructuring Props", "slug": "destructuring-props", "xp": 20, "difficulty": "easy" },
            { "name": "Passing JSX as Children", "slug": "passing-jsx-as-children", "xp": 25, "difficulty": "medium" },
            { "name": "Props Challenge", "slug": "props-challenge", "xp": 25, "difficulty": "medium" }
        ]
    },
    {
        "id": 4,
        "name": "State (useState)",
        "desc": "Add interactivity to your app by allowing components to remember information.",
        "exercises": [
            { "name": "Initialize State", "slug": "initialize-state", "xp": 30, "difficulty": "easy" },
            { "name": "Updating State", "slug": "updating-state", "xp": 20, "difficulty": "easy" },
            { "name": "Build a Counter", "slug": "build-a-counter", "xp": 30, "difficulty": "medium" },
            { "name": "State vs Props", "slug": "state-vs-props", "xp": 15, "difficulty": "easy" },
            { "name": "Multiple State Variables", "slug": "multiple-state-variables", "xp": 25, "difficulty": "easy" },
            { "name": "Previous State Pattern", "slug": "previous-state-pattern", "xp": 35, "difficulty": "medium" }
        ]
    },
    {
        "id": 5,
        "name": "Handling Events",
        "desc": "Respond to user interactions like clicks, form submissions, and typing.",
        "exercises": [
            { "name": "Click Handler", "slug": "click-handler", "xp": 20, "difficulty": "easy" },
            { "name": "Reading Input Values", "slug": "reading-input-values", "xp": 25, "difficulty": "easy" },
            { "name": "Passing Arguments", "slug": "passing-arguments", "xp": 40, "difficulty": "medium" },
            { "name": "Prevent Default", "slug": "prevent-default", "xp": 20, "difficulty": "easy" },
            { "name": "Event Propagation", "slug": "event-propagation", "xp": 30, "difficulty": "medium" },
            { "name": "Button Toggle", "slug": "button-toggle", "xp": 25, "difficulty": "easy" }
        ]
    },
    {
        "id": 6,
        "name": "Conditional Rendering",
        "desc": "Render different components or elements based on certain conditions.",
        "exercises": [
            { "name": "If-Else Logic", "slug": "if-else-logic", "xp": 20, "difficulty": "easy" },
            { "name": "Ternary Operator", "slug": "ternary-operator", "xp": 25, "difficulty": "medium" },
            { "name": "Logical AND (&&)", "slug": "logical-and", "xp": 20, "difficulty": "easy" },
            { "name": "Show/Hide Element", "slug": "show-hide-element", "xp": 15, "difficulty": "easy" },
            { "name": "Auth Status Display", "slug": "auth-status-display", "xp": 25, "difficulty": "medium" },
            { "name": "Null Rendering", "slug": "null-rendering", "xp": 15, "difficulty": "easy" }
        ]
    },
    {
        "id": 7,
        "name": "Lists & Keys",
        "desc": "Render lists of data dynamically using the JavaScript map function.",
        "exercises": [
            { "name": "Rendering Arrays", "slug": "rendering-arrays", "xp": 20, "difficulty": "easy" },
            { "name": "Using Map", "slug": "using-map", "xp": 25, "difficulty": "easy" },
            { "name": "The Key Prop", "slug": "the-key-prop", "xp": 35, "difficulty": "medium" },
            { "name": "Filter List Items", "slug": "filter-list-items", "xp": 25, "difficulty": "medium" },
            { "name": "Extracting List Item", "slug": "extracting-list-item", "xp": 20, "difficulty": "easy" },
            { "name": "Index as Key (Warning)", "slug": "index-as-key-warning", "xp": 30, "difficulty": "medium" }
        ]
    },
    {
        "id": 8,
        "name": "Effects (useEffect)",
        "desc": "Perform side effects like fetching data, timers, or subscribing to events.",
        "exercises": [
            { "name": "Basic Effect", "slug": "basic-effect", "xp": 30, "difficulty": "medium" },
            { "name": "Dependency Array", "slug": "dependency-array", "xp": 25, "difficulty": "easy" },
            { "name": "Run Once (Mount)", "slug": "run-once-mount", "xp": 20, "difficulty": "easy" },
            { "name": "Fetching Data", "slug": "fetching-data", "xp": 45, "difficulty": "medium" },
            { "name": "Cleanup Function", "slug": "cleanup-function", "xp": 35, "difficulty": "hard" },
            { "name": "Update Document Title", "slug": "update-document-title", "xp": 15, "difficulty": "easy" }
        ]
    },
    {
        "id": 9,
        "name": "React Forms",
        "desc": "Handle form inputs and validation using Controlled Components.",
        "exercises": [
            { "name": "Controlled Input", "slug": "controlled-input", "xp": 30, "difficulty": "medium" },
            { "name": "Handling Textarea", "slug": "handling-textarea", "xp": 20, "difficulty": "easy" },
            { "name": "Select Dropdown", "slug": "select-dropdown", "xp": 25, "difficulty": "easy" },
            { "name": "Multi-Input Handling", "slug": "multi-input-handling", "xp": 40, "difficulty": "hard" },
            { "name": "Simple Validation", "slug": "simple-validation", "xp": 35, "difficulty": "medium" },
            { "name": "Form Submission", "slug": "form-submission", "xp": 25, "difficulty": "easy" }
        ]
    },
    {
        "id": 10,
        "name": "Styling in React",
        "desc": "Learn different ways to style your React components.",
        "exercises": [
            { "name": "Inline Styles", "slug": "inline-styles", "xp": 15, "difficulty": "easy" },
            { "name": "CSS Classes", "slug": "css-classes", "xp": 20, "difficulty": "easy" },
            { "name": "CSS Modules", "slug": "css-modules", "xp": 30, "difficulty": "medium" },
            { "name": "Dynamic Styling", "slug": "dynamic-styling", "xp": 35, "difficulty": "medium" },
            { "name": "Tailwind Basics", "slug": "tailwind-basics", "xp": 25, "difficulty": "easy" },
            { "name": "Conditional Classes", "slug": "conditional-classes", "xp": 25, "difficulty": "medium" }
        ]
    }
];

// --- 3. CSS COURSE DATA (ID: 3) ---
const CSS_CHAPTERS = [
    {
        "id": 1,
        "name": "CSS Introduction",
        "desc": "Learn how to style HTML elements and make your web pages look beautiful.",
        "exercises": [
            { "name": "Select the Elements", "slug": "select-the-elements", "xp": 20, "difficulty": "easy" },
            { "name": "Change Text Color", "slug": "change-text-color", "xp": 15, "difficulty": "easy" },
            { "name": "Background Magic", "slug": "background-magic", "xp": 20, "difficulty": "easy" },
            { "name": "Class Selectors", "slug": "class-selectors", "xp": 25, "difficulty": "easy" },
            { "name": "ID Selectors", "slug": "id-selectors", "xp": 25, "difficulty": "easy" },
            { "name": "External Stylesheet", "slug": "external-stylesheet", "xp": 30, "difficulty": "medium" }
        ]
    },
    {
        "id": 2,
        "name": "The Box Model",
        "desc": "Master the core concept of layout: margins, borders, padding, and content.",
        "exercises": [
            { "name": "Add Some Padding", "slug": "add-some-padding", "xp": 20, "difficulty": "easy" },
            { "name": "Margin Mastery", "slug": "margin-mastery", "xp": 25, "difficulty": "medium" },
            { "name": "Border Builder", "slug": "border-builder", "xp": 20, "difficulty": "easy" },
            { "name": "Box Sizing Fix", "slug": "box-sizing-fix", "xp": 35, "difficulty": "medium" },
            { "name": "Visualize the Box", "slug": "visualize-the-box", "xp": 15, "difficulty": "easy" },
            { "name": "Layout Spacer", "slug": "layout-spacer", "xp": 30, "difficulty": "medium" }
        ]
    },
    {
        "id": 3,
        "name": "Typography & Fonts",
        "desc": "Style text effectively using font families, weights, sizes, and alignment.",
        "exercises": [
            { "name": "Font Family Swap", "slug": "font-family-swap", "xp": 20, "difficulty": "easy" },
            { "name": "Text Alignment", "slug": "text-alignment", "xp": 15, "difficulty": "easy" },
            { "name": "Line Height Logic", "slug": "line-height-logic", "xp": 25, "difficulty": "medium" },
            { "name": "Google Fonts Import", "slug": "google-fonts-import", "xp": 30, "difficulty": "medium" },
            { "name": "Text Decoration", "slug": "text-decoration", "xp": 20, "difficulty": "easy" },
            { "name": "Font Weight Challenge", "slug": "font-weight-challenge", "xp": 20, "difficulty": "easy" }
        ]
    },
    {
        "id": 4,
        "name": "Flexbox Layout",
        "desc": "Learn the modern way to arrange elements in rows and columns efficiently.",
        "exercises": [
            { "name": "Flex Container", "slug": "flex-container", "xp": 20, "difficulty": "easy" },
            { "name": "Justify Content", "slug": "justify-content", "xp": 30, "difficulty": "medium" },
            { "name": "Align Items", "slug": "align-items", "xp": 30, "difficulty": "medium" },
            { "name": "Flex Direction", "slug": "flex-direction", "xp": 25, "difficulty": "easy" },
            { "name": "Flex Wrap", "slug": "flex-wrap", "xp": 25, "difficulty": "medium" },
            { "name": "Perfect Centering", "slug": "perfect-centering", "xp": 40, "difficulty": "hard" }
        ]
    },
    {
        "id": 5,
        "name": "CSS Grid",
        "desc": "Build complex two-dimensional layouts with rows and columns.",
        "exercises": [
            { "name": "Grid Initialization", "slug": "grid-initialization", "xp": 25, "difficulty": "medium" },
            { "name": "Define Columns", "slug": "define-columns", "xp": 30, "difficulty": "medium" },
            { "name": "Grid Gap", "slug": "grid-gap", "xp": 20, "difficulty": "easy" },
            { "name": "Span Multiple Rows", "slug": "span-multiple-rows", "xp": 35, "difficulty": "hard" },
            { "name": "Grid Areas", "slug": "grid-areas", "xp": 40, "difficulty": "hard" },
            { "name": "Responsive Grid", "slug": "responsive-grid", "xp": 45, "difficulty": "hard" }
        ]
    },
    {
        "id": 6,
        "name": "Colors & Backgrounds",
        "desc": "Dive deep into color theory, gradients, and background images.",
        "exercises": [
            { "name": "Hex Codes", "slug": "hex-codes", "xp": 15, "difficulty": "easy" },
            { "name": "RGBA Transparency", "slug": "rgba-transparency", "xp": 25, "difficulty": "medium" },
            { "name": "Linear Gradient", "slug": "linear-gradient", "xp": 30, "difficulty": "medium" },
            { "name": "Background Position", "slug": "background-position", "xp": 20, "difficulty": "easy" },
            { "name": "Cover vs Contain", "slug": "cover-vs-contain", "xp": 25, "difficulty": "medium" },
            { "name": "Fixed Background", "slug": "fixed-background", "xp": 20, "difficulty": "easy" }
        ]
    },
    {
        "id": 7,
        "name": "Responsive Design",
        "desc": "Make your websites look great on mobile, tablet, and desktop screens.",
        "exercises": [
            { "name": "Meta Viewport", "slug": "meta-viewport", "xp": 20, "difficulty": "easy" },
            { "name": "Media Query Basics", "slug": "media-query-basics", "xp": 30, "difficulty": "medium" },
            { "name": "Mobile First Logic", "slug": "mobile-first-logic", "xp": 35, "difficulty": "hard" },
            { "name": "Percent vs Pixels", "slug": "percent-vs-pixels", "xp": 25, "difficulty": "medium" },
            { "name": "Hide on Mobile", "slug": "hide-on-mobile", "xp": 20, "difficulty": "easy" },
            { "name": "Responsive Typography", "slug": "responsive-typography", "xp": 30, "difficulty": "medium" }
        ]
    },
    {
        "id": 8,
        "name": "Positioning",
        "desc": "Control exactly where elements appear using relative, absolute, and fixed positioning.",
        "exercises": [
            { "name": "Relative Shift", "slug": "relative-shift", "xp": 20, "difficulty": "easy" },
            { "name": "Absolute Layout", "slug": "absolute-layout", "xp": 35, "difficulty": "hard" },
            { "name": "Fixed Navigation", "slug": "fixed-navigation", "xp": 30, "difficulty": "medium" },
            { "name": "Sticky Header", "slug": "sticky-header", "xp": 25, "difficulty": "medium" },
            { "name": "Z-Index Stacking", "slug": "z-index-stacking", "xp": 40, "difficulty": "hard" },
            { "name": "Float Clearing", "slug": "float-clearing", "xp": 20, "difficulty": "medium" }
        ]
    },
    {
        "id": 9,
        "name": "Transitions & Animation",
        "desc": "Bring your site to life with smooth movements and keyframe animations.",
        "exercises": [
            { "name": "Hover Effect", "slug": "hover-effect", "xp": 20, "difficulty": "easy" },
            { "name": "Transition Duration", "slug": "transition-duration", "xp": 25, "difficulty": "easy" },
            { "name": "Ease In Out", "slug": "ease-in-out", "xp": 20, "difficulty": "medium" },
            { "name": "Rotate & Scale", "slug": "rotate-and-scale", "xp": 30, "difficulty": "medium" },
            { "name": "Keyframe Basics", "slug": "keyframe-basics", "xp": 40, "difficulty": "hard" },
            { "name": "Infinite Loop", "slug": "infinite-loop", "xp": 25, "difficulty": "easy" }
        ]
    },
    {
        "id": 10,
        "name": "CSS Variables",
        "desc": "Write cleaner, maintainable CSS using custom properties (variables).",
        "exercises": [
            { "name": "Define a Variable", "slug": "define-a-variable", "xp": 20, "difficulty": "easy" },
            { "name": "Use the Variable", "slug": "use-the-variable", "xp": 20, "difficulty": "easy" },
            { "name": "Global vs Local", "slug": "global-vs-local", "xp": 30, "difficulty": "medium" },
            { "name": "Theming with Variables", "slug": "theming-with-variables", "xp": 40, "difficulty": "hard" },
            { "name": "Calc() Function", "slug": "calc-function", "xp": 35, "difficulty": "medium" },
            { "name": "Fallback Values", "slug": "fallback-values", "xp": 25, "difficulty": "easy" }
        ]
    }
];


// --- 4. PYTHON COURSE DATA (ID: 4) ---
const PYTHON_CHAPTERS = [
    {
        "id": 1,
        "name": "Python Basics",
        "desc": "Start your journey with Python syntax, printing, and basic operations.",
        "exercises": [
            { "name": "Hello Python", "slug": "hello-python", "xp": 10, "difficulty": "easy" },
            { "name": "Print Multiple Lines", "slug": "print-multiple-lines", "xp": 15, "difficulty": "easy" },
            { "name": "Comments & Docs", "slug": "comments-and-docs", "xp": 10, "difficulty": "easy" },
            { "name": "Basic Math", "slug": "basic-math", "xp": 20, "difficulty": "easy" },
            { "name": "Python Indentation", "slug": "python-indentation", "xp": 25, "difficulty": "medium" },
            { "name": "Errors & Syntax", "slug": "errors-and-syntax", "xp": 15, "difficulty": "easy" }
        ]
    },
    {
        "id": 2,
        "name": "Variables & Data Types",
        "desc": "Store data using variables and understand strings, integers, and floats.",
        "exercises": [
            { "name": "Create a Variable", "slug": "create-a-variable", "xp": 20, "difficulty": "easy" },
            { "name": "String Concatenation", "slug": "string-concatenation", "xp": 25, "difficulty": "medium" },
            { "name": "Integers vs Floats", "slug": "integers-vs-floats", "xp": 20, "difficulty": "easy" },
            { "name": "Type Conversion", "slug": "type-conversion", "xp": 30, "difficulty": "medium" },
            { "name": "Boolean Logic", "slug": "boolean-logic", "xp": 15, "difficulty": "easy" },
            { "name": "f-Strings", "slug": "f-strings", "xp": 25, "difficulty": "easy" }
        ]
    },
    {
        "id": 3,
        "name": "Control Flow (If/Else)",
        "desc": "Make decisions in your code using conditions and comparison operators.",
        "exercises": [
            { "name": "Simple If Statement", "slug": "simple-if-statement", "xp": 20, "difficulty": "easy" },
            { "name": "Else & Elif", "slug": "else-and-elif", "xp": 25, "difficulty": "medium" },
            { "name": "Comparison Operators", "slug": "comparison-operators", "xp": 20, "difficulty": "easy" },
            { "name": "Logical AND OR", "slug": "logical-and-or", "xp": 30, "difficulty": "medium" },
            { "name": "Nested Conditions", "slug": "nested-conditions", "xp": 35, "difficulty": "hard" },
            { "name": "User Input Check", "slug": "user-input-check", "xp": 25, "difficulty": "medium" }
        ]
    },
    {
        "id": 4,
        "name": "Python Lists",
        "desc": "Manage collections of items using lists, indexing, and slicing.",
        "exercises": [
            { "name": "Create a List", "slug": "create-a-list", "xp": 20, "difficulty": "easy" },
            { "name": "Access Items", "slug": "access-items", "xp": 20, "difficulty": "easy" },
            { "name": "List Slicing", "slug": "list-slicing", "xp": 30, "difficulty": "medium" },
            { "name": "Append & Remove", "slug": "append-and-remove", "xp": 25, "difficulty": "easy" },
            { "name": "Sort & Reverse", "slug": "sort-and-reverse", "xp": 20, "difficulty": "easy" },
            { "name": "List Length", "slug": "list-length", "xp": 15, "difficulty": "easy" }
        ]
    },
    {
        "id": 5,
        "name": "Loops (For & While)",
        "desc": "Automate repetitive tasks using loops to iterate over data.",
        "exercises": [
            { "name": "Basic For Loop", "slug": "basic-for-loop", "xp": 25, "difficulty": "easy" },
            { "name": "Loop Through List", "slug": "loop-through-list", "xp": 25, "difficulty": "easy" },
            { "name": "The Range Function", "slug": "the-range-function", "xp": 30, "difficulty": "medium" },
            { "name": "While Loop Basics", "slug": "while-loop-basics", "xp": 30, "difficulty": "medium" },
            { "name": "Break & Continue", "slug": "break-and-continue", "xp": 35, "difficulty": "hard" },
            { "name": "Nested Loops", "slug": "nested-loops", "xp": 40, "difficulty": "hard" }
        ]
    },
    {
        "id": 6,
        "name": "Functions",
        "desc": "Write reusable blocks of code to organize logic effectively.",
        "exercises": [
            { "name": "Define a Function", "slug": "define-a-function", "xp": 20, "difficulty": "easy" },
            { "name": "Return Values", "slug": "return-values", "xp": 25, "difficulty": "medium" },
            { "name": "Parameters & Arguments", "slug": "parameters-and-arguments", "xp": 30, "difficulty": "medium" },
            { "name": "Default Arguments", "slug": "default-arguments", "xp": 25, "difficulty": "easy" },
            { "name": "Variable Scope", "slug": "variable-scope", "xp": 35, "difficulty": "hard" },
            { "name": "Lambda Functions", "slug": "lambda-functions", "xp": 40, "difficulty": "hard" }
        ]
    },
    {
        "id": 7,
        "name": "Dictionaries",
        "desc": "Store key-value pairs to represent structured data.",
        "exercises": [
            { "name": "Create Dictionary", "slug": "create-dictionary", "xp": 20, "difficulty": "easy" },
            { "name": "Access Values", "slug": "access-values", "xp": 20, "difficulty": "easy" },
            { "name": "Add Update Items", "slug": "add-update-items", "xp": 25, "difficulty": "medium" },
            { "name": "Loop Dictionary", "slug": "loop-dictionary", "xp": 30, "difficulty": "medium" },
            { "name": "Nested Dictionaries", "slug": "nested-dictionaries", "xp": 40, "difficulty": "hard" },
            { "name": "Get Method", "slug": "get-method", "xp": 25, "difficulty": "easy" }
        ]
    },
    {
        "id": 8,
        "name": "Tuples & Sets",
        "desc": "Explore immutable collections (tuples) and unique collections (sets).",
        "exercises": [
            { "name": "Tuple Basics", "slug": "tuple-basics", "xp": 20, "difficulty": "easy" },
            { "name": "Unpacking Tuples", "slug": "unpacking-tuples", "xp": 30, "difficulty": "medium" },
            { "name": "Create a Set", "slug": "create-a-set", "xp": 20, "difficulty": "easy" },
            { "name": "Add Remove Set", "slug": "add-remove-set", "xp": 25, "difficulty": "easy" },
            { "name": "Set Operations", "slug": "set-operations", "xp": 35, "difficulty": "hard" },
            { "name": "Tuple vs List", "slug": "tuple-vs-list", "xp": 15, "difficulty": "easy" }
        ]
    },
    {
        "id": 9,
        "name": "Modules & Libraries",
        "desc": "Extend Python's capabilities by importing external code.",
        "exercises": [
            { "name": "Import Math", "slug": "import-math", "xp": 20, "difficulty": "easy" },
            { "name": "Random Module", "slug": "random-module", "xp": 25, "difficulty": "medium" },
            { "name": "Datetime Module", "slug": "datetime-module", "xp": 30, "difficulty": "medium" },
            { "name": "Pip Install", "slug": "pip-install", "xp": 20, "difficulty": "easy" },
            { "name": "Create Module", "slug": "create-module", "xp": 35, "difficulty": "hard" },
            { "name": "From Import Syntax", "slug": "from-import-syntax", "xp": 25, "difficulty": "easy" }
        ]
    },
    {
        "id": 10,
        "name": "Error Handling",
        "desc": "Write robust code that can handle errors gracefully using try/except.",
        "exercises": [
            { "name": "Try Except Block", "slug": "try-except-block", "xp": 25, "difficulty": "medium" },
            { "name": "Catch Specific Error", "slug": "catch-specific-error", "xp": 30, "difficulty": "medium" },
            { "name": "Finally Block", "slug": "finally-block", "xp": 25, "difficulty": "easy" },
            { "name": "Raise Exception", "slug": "raise-exception", "xp": 35, "difficulty": "hard" },
            { "name": "Input Validation", "slug": "input-validation", "xp": 40, "difficulty": "hard" },
            { "name": "Debugging Basics", "slug": "debugging-basics", "xp": 20, "difficulty": "easy" }
        ]
    }
];

// --- 3. MAIN FUNCTION ---
export async function GET(req: NextRequest) {
    
    // Process HTML Chapters
    for (const item of HTML_CHAPTERS) {
        await db.insert(CourseChaptersTable).values({
            courseId: 2, // Assuming HTML Course ID is 2
            desc: item?.desc,
            exercises: item.exercises,
            name: item?.name,
            chapterId: item?.id
        });
    }

    // Process React Chapters
    for (const item of REACT_CHAPTERS) {
        await db.insert(CourseChaptersTable).values({
            courseId: 1, // Assuming React Course ID is 1
            desc: item?.desc,
            exercises: item.exercises,
            name: item?.name,
            chapterId: item?.id
        });
    }

    for (const item of CSS_CHAPTERS) {
        await db.insert(CourseChaptersTable).values({
            courseId: 3, // Matches CSS Beginner in your DB
            desc: item?.desc,
            exercises: item.exercises,
            name: item?.name,
            chapterId: item?.id
        });
    }

    // Process Python Chapters (CourseID: 4)
    for (const item of PYTHON_CHAPTERS) {
        await db.insert(CourseChaptersTable).values({
            courseId: 4, // Matches Python Beginner in your DB
            desc: item?.desc,
            exercises: item.exercises,
            name: item?.name,
            chapterId: item?.id
        });
    }

    return NextResponse.json('Success - HTML,React, CSS & Python Chapters Added');
}