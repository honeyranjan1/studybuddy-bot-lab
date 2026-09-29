# Project architecture decisions

- Use `PageScene3D` for ambient page scenes and exported focused 3D modules inside feature layouts, so 3D remains reusable without obscuring working content.
- Keep AI Tutor session persistence and streaming in the existing chat data flow; visual 3D bubbles consume the same in-memory messages as a read-only live projection.