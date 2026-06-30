# DESIGN.md

## Project
DevDocs AI Copilot

## Goal
Redesign the current dashboard UI into a premium, modern, highly polished product experience. The current layout is functional but visually plain. The new design should feel professional, sharp, elegant, and product ready, similar in quality to modern SaaS dashboards such as Vercel, Linear, Raycast, Notion, and other clean developer focused tools.

The product is an AI copilot dashboard for document based chat, RAG workflows, agent runs, uploads, and settings.

## Core design direction
Create a visually striking, highly usable dashboard with these qualities:

• Minimal and clean
• Premium and modern
• Developer tool aesthetic
• Soft depth and subtle layering
• Beautiful spacing and strong typography
• Refined cards and panels
• Calm neutral palette with a tasteful accent color
• Clear hierarchy and polished micro interactions
• Feels like a real startup product, not a generic admin template

## Visual style reference
Use a Vercel inspired visual language, but do not copy Vercel directly.
The final result should feel:

• Crisp and elegant
• Minimal but not empty
• Sophisticated and polished
• High contrast where needed
• Subtle gradients and shadows
• Slightly futuristic but still practical

## Main themes
Offer both light mode and dark mode.
Default should be dark mode because it suits an AI developer product.

### Dark theme direction
• Background: deep charcoal or near black, not pure black
• Surface cards: slightly lighter than background
• Borders: thin, soft, low contrast
• Text: high contrast white and soft gray hierarchy
• Accent: blue, cyan, or violet used sparingly
• Highlights: subtle glow or gradient edge for active states

### Light theme direction
• Background: warm white or soft gray
• Cards: pure white or near white
• Borders: soft neutral gray
• Text: deep slate and gray hierarchy
• Accent: same blue, cyan, or violet system

## Suggested color system
### Dark
• Background: #0A0A0B
• Surface: #111214
• Surface 2: #16181D
• Border: rgba(255,255,255,0.08)
• Primary text: #F5F7FA
• Secondary text: #A4ACB9
• Muted text: #7B8494
• Accent blue: #4F8CFF
• Accent cyan: #35C2FF
• Accent violet: #8B5CF6
• Success: #22C55E
• Warning: #F59E0B
• Danger: #EF4444

### Light
• Background: #F6F8FB
• Surface: #FFFFFF
• Surface 2: #F9FAFB
• Border: #E6EAF0
• Primary text: #0F172A
• Secondary text: #475569
• Muted text: #64748B
• Accent blue: #2563EB
• Accent cyan: #0891B2
• Accent violet: #7C3AED
• Success: #16A34A
• Warning: #D97706
• Danger: #DC2626

## Typography
Use a clean modern font stack.
Preferred options:

• Geist
• Inter
• SF Pro Display
• ui-sans-serif fallback

Typography rules:

• Large headings should feel bold and confident
• Supporting text should be calm and easy to scan
• Use tighter spacing for titles and relaxed spacing for body text
• Use consistent sizing scale

Suggested scale:

• Page title: 32px, semibold
• Section title: 20px to 24px, semibold
• Card title: 16px to 18px, medium or semibold
• Body: 14px to 16px
• Helper text: 13px to 14px
• Tiny metadata: 12px

## Layout structure
### App shell
Create a strong application shell with:

1. Left sidebar
2. Top header or page header area
3. Main content region with comfortable max width
4. Consistent page paddings and vertical rhythm

### Sidebar redesign
The current sidebar is too plain. Improve it with:

• Branded logo or wordmark at the top
• Workspace switcher or product area
• User profile compact section
• Better navigation groups
• Active menu item highlight with filled pill or glow border
• Optional icons for each nav item
• Clear visual grouping for main navigation and utility navigation
• Sticky logout button at bottom

Sidebar sections:

• Overview
• Documents
• Upload
• Chat
• Agents
• Sessions
• Settings

Sidebar style:

• Width around 260px to 280px
• Rounded container or full height panel feel
• Slight inner border or divider
• Subtle background contrast against main content

### Header area
Each page should have a premium header with:

• Small eyebrow label like WORKSPACE or DOCUMENTS
• Large title
• One line supporting description
• Main action buttons on the right if needed
• Search bar or command bar optionally placed in header

## Dashboard page design
The dashboard should not feel empty. Even when there is no data, it should still look intentional and premium.

### Recommended dashboard sections
1. Hero summary area
2. Quick actions row
3. Stats cards
4. Recent documents or recent activity
5. AI usage or session overview
6. Empty state with illustration or premium placeholder

### Hero summary section
Create a polished hero panel with:

• Title such as “Welcome back, Anwar” or “Copilot dashboard”
• Subtitle describing what the app does
• Primary CTA: Upload documents
• Secondary CTA: Start chat
• Optional decorative gradient, subtle grid, or blur background accents

### Stats cards
Use 4 cards in a responsive grid:

• Total documents
• Total chat sessions
• Agent runs
• Last activity or storage used

Card design:

• Rounded corners 16px to 20px
• Soft border
• Slight shadow in light mode
• Slight glow or soft overlay in dark mode
• Use icon, label, number, and micro trend or status text

### Quick actions
Instead of plain boxes, create elegant shortcut cards or buttons:

• Upload docs
• View documents
• Open chat
• Configure settings

Each quick action card should have:

• Icon
• Title
• Short supporting text
• Hover animation
• Click affordance

### Empty state
Make the empty state look intentional and premium:

• Friendly headline
• One sentence instruction
• Primary upload button
• Optional illustration made from simple geometric shapes or document icons
• Do not make it look like a blank error box

## Documents page
Should include:

• Search input
• Filter chips or dropdowns
• Sort dropdown
• Document cards or table view toggle
• Status badges like Processing, Indexed, Failed, Ready
• Metadata such as upload time, file type, chunk count
• Row actions menu

Recommended design:

• Use polished cards or a clean table with modern spacing
• Add mini preview or file icon
• Use empty and loading skeleton states

## Upload page
Should feel like a premium file ingestion experience.

Include:

• Drag and drop zone
• File type support text
• Progress indicator
• Upload queue list
• Recent uploads section
• States for uploading, processing, embedding, completed, failed

Style:

• Large centered drop zone card
• Dashed border with polished hover state
• Animated progress bars
• Success and error notifications

## Chat page
This is one of the most important screens.

Should include:

• Conversation list or history sidebar optionally
• Main chat panel
• Message bubbles with clear distinction between user and assistant
• Citations panel or inline sources
• Suggested prompts
• Typing or streaming state
• Model or mode badge like RAG or Agent
• Input area with attachment or send action

Chat style:

• Premium chat layout similar to modern AI apps
• Clean message spacing
• Syntax highlighted code blocks
• Beautiful citation chips
• Comfortable input dock with rounded container

## Agents page
Show agent workflows in a visually clear way.

Include:

• List of agent runs
• Status badges
• Timeline or step list
• Node by node progress
• Retry counts
• Start and end timestamps
• Final output summary

Style:

• Timeline UI
• Step cards
• Expandable details
• Visual status indicators

## Settings page
Should be clean and modular.

Include sections for:

• Profile
• Workspace settings
• Theme preferences
• Model configuration
• Cloudflare AI configuration status
• Embedding settings
• Retrieval settings
• Security settings

Use:

• Section cards
• Form inputs with clear labels
• Save state indicators
• Success toast feedback

## Component level design rules
### Buttons
• Rounded, modern, medium height
• Primary button should feel premium and slightly luminous
• Secondary button should be subtle and elegant
• Tertiary buttons should feel lightweight
• Hover and active states must be clearly designed

### Cards
• Use medium to large radius
• Keep padding generous
• Use subtle borders instead of heavy shadows
• On hover, slightly raise or brighten the card

### Inputs
• Use clean borders, good focus rings, and soft surfaces
• Search bars should feel refined and spacious
• Input labels should be subtle but readable

### Badges
• Small rounded pills
• Use semantic colors for statuses
• Keep them elegant, not loud

### Tables
• Large readable row height
• Soft dividers
• Sticky header if useful
• Row hover effect

### Empty states
• Always use a title, supporting text, and CTA
• Add visual character using iconography or minimal illustration

## Spacing and radius system
### Spacing
• Base unit: 4px
• Most common spacing: 8, 12, 16, 20, 24, 32

### Radius
• Small: 10px
• Medium: 14px
• Large: 18px
• XL hero panels: 24px

## Motion and interactions
Use subtle motion to make the product feel premium.

• Smooth hover transitions around 150ms to 220ms
• Slight scale or lift on cards
• Soft opacity transitions for state changes
• Loading skeletons with polished shimmer
• Page transitions should be minimal and clean

Avoid over animation.

## UX guidance
• Keep the interface calm and uncluttered
• Use strong visual hierarchy
• Make important actions obvious
• Keep navigation intuitive
• Make empty states useful
• Ensure accessibility and contrast
• Maintain consistency across all pages

## Responsiveness
### Desktop
• Sidebar always visible
• Comfortable content width
• Multi column card layouts

### Tablet
• Sidebar can collapse
• Grid becomes 2 columns where needed

### Mobile
• Sidebar becomes drawer
• Cards stack vertically
• Header actions collapse gracefully
• Chat input remains easy to use

## Icon style
Use simple modern line icons.
Suggested libraries:

• Lucide React
• Radix Icons
• Tabler Icons

## Recommended frontend libraries
• Tailwind CSS
• shadcn/ui
• Framer Motion for subtle animation
• Lucide React for icons
• React Query for server state
• Zustand for local UI state if needed

## Design system keywords
Use these words to guide implementation:

• premium
• modern
• elegant
• minimal
• high end
• developer first
• clean SaaS
• subtle gradients
• layered surfaces
• crisp typography
• polished micro interactions

## Copy ready master prompt
Use the prompt below in Cursor, Claude, Lovable, v0, or any AI coding assistant.

---

Redesign my existing React dashboard into a premium, highly polished SaaS product UI for an AI copilot application called DevDocs AI Copilot.

The current UI is functional but too plain and empty. I want the full interface to feel modern, elegant, clean, and professional, similar in quality to Vercel, Linear, and other world class developer focused dashboards, but without copying them directly.

Build a beautiful dashboard theme with a strong visual identity and excellent UX. Use React, TypeScript, Tailwind CSS, and shadcn/ui components. Use a modern font such as Geist or Inter. Add Lucide icons and subtle Framer Motion animations where appropriate.

The product includes these pages: Dashboard, Documents, Upload, Chat, Agents, Sessions, and Settings.

Design requirements:

• Create a premium left sidebar with logo, navigation items, icons, active state, and logout button pinned at the bottom
• Create a refined page header with eyebrow text, large title, supporting description, and optional actions
• Use a dark theme by default, with support for light mode
• Use a clean color palette with near black backgrounds, layered surfaces, soft borders, strong typography, and a restrained accent color such as blue, cyan, or violet
• Use large rounded cards, subtle shadows or glow, and generous spacing
• Add polished quick action cards on the dashboard
• Add beautiful stat cards for total documents, sessions, agent runs, and activity
• Improve empty states so they feel intentional and attractive
• Design a high quality chat interface with message bubbles, source citations, code block support, typing state, and prompt suggestions
• Design a premium upload experience with drag and drop, upload progress, processing states, and recent uploads
• Design a clean documents page with search, filters, status badges, and document cards or tables
• Design an agent runs page with a visual timeline or step based workflow display
• Design a modular settings page with grouped form sections inside elegant cards
• Add responsive behavior for desktop, tablet, and mobile
• Keep the interface minimal but not empty
• Focus heavily on spacing, hierarchy, contrast, and overall polish

Visual direction:

• Premium SaaS dashboard
• Vercel inspired cleanliness
• Linear inspired sharpness
• Developer tool aesthetic
• Soft depth and subtle layering
• Elegant dark UI
• Modern, crisp, and product ready

Implement the UI with reusable components and a scalable design system. Make it look like a real startup product that could be shipped to users.

---

## Optional implementation notes for AI coding tools
If the coding assistant supports implementation planning, ask it to do this in order:

1. Create global theme tokens
2. Create app shell layout
3. Redesign sidebar and header
4. Redesign dashboard page
5. Redesign documents page
6. Redesign upload page
7. Redesign chat page
8. Redesign agents page
9. Redesign settings page
10. Add responsive behavior and polish

## Final note
The most important outcome is not just a prettier interface. The UI should feel like a premium AI product that is trustworthy, modern, and enjoyable to use every day.
