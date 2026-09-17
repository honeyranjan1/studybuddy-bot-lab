# StudyBuddy 3D Redesign

## Direction
Rebuild StudyBuddy around a **game-like Digital Study Desk**: a dark, cinematic study room where the desk is the navigation. The visual language will keep the supplied portfolio reference’s sharp editorial typography, sparse white interface, black foundation, pixel accents, and compact information layout—adapted to StudyBuddy rather than copied as a portfolio.

## What will change
- Replace the current scrolling public landing page with a full-viewport 3D desk experience.
- Make recognizable desk objects interactive entry points:
  - notebook → Notes
  - flashcards → Flashcards
  - quiz sheet → Quiz
  - monitor → AI Tutor
  - code screen → DSA Practice
  - calendar → Exam Countdown
- Add game-like camera movement on desktop using keyboard and mouse, plus touch controls on mobile.
- Keep a clear 2D interface above the scene for the StudyBuddy name, primary action, navigation, labels, and accessibility.
- Add focused camera transitions and object feedback when a tool is selected.
- Restyle authenticated navigation, dashboard, tools, placement, partners, profile, and tool pages into the same black/white/red editorial system.
- Preserve all existing learning, chat, placement, interview, partner, and account functionality.

## Experience structure
```text
Public landing
└── Interactive 3D study desk
    ├── Explore desk / select objects
    ├── Open a tool directly
    └── Sign in / enter workspace

Authenticated app
├── Compact editorial navigation
├── High-contrast workspace surfaces
├── Consistent tool headers and controls
└── Subtle 3D depth/motion without reducing readability
```

## Technical approach
- Use React Three Fiber 8, Drei 9, and Three.js, matching the existing React 18 app.
- Source lightweight CC0 desk props where suitable; use procedural geometry only for abstract screens, indicators, and ambient details.
- Use a lit, tactile material system with local environment lighting, soft shadows, restrained red accents, and no neon sci-fi treatment.
- Use camera-relative movement, bounded navigation, click/tap object selection, keyboard controls, and a mobile virtual joystick.
- Keep the 3D scene within a mobile-friendly budget: capped pixel ratio, limited shadows, fewer than 100 draw calls, and reduced effects on smaller devices.
- Respect reduced-motion settings and provide normal navigation links so every destination remains keyboard-accessible.
- Consolidate global colors, typography, spacing, surfaces, and motion into reusable tokens and shared components instead of page-specific styling.

## Implementation stages
1. Build and verify the 3D landing scene, controls, clickable desk objects, loading state, and mobile fallback.
2. Replace the public landing composition and responsive menu with the new editorial overlay.
3. Rebuild the authenticated shell and shared page-header/control patterns.
4. Apply the system across dashboard, tools, AI tutor, placement, partners, profile, and remaining study-tool pages without changing their logic.
5. Validate desktop and mobile layouts, keyboard/touch interactions, scene visibility, performance, and existing core flows.
