# 3D Model Builder - Dirac

A modern single-page React + TypeScript application for creating hierarchical 3D models from geometric primitives. Features an intuitive tree-based interface with real-time 3D visualization powered by Three.js, comprehensive property editing, and full undo/redo support.

![React](https://img.shields.io/badge/React-19.1.1-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6?logo=typescript)
![Three.js](https://img.shields.io/badge/Three.js-0.181.0-000000?logo=three.js)
![Vite](https://img.shields.io/badge/Vite-7.1.7-646CFF?logo=vite)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm/yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd dirac

# Install dependencies
pnpm install
```

### Development

Start the development server:

```bash
pnpm dev
```

The application will be available at `http://localhost:5173` (or the port shown in your terminal).

### Building for Production

```bash
pnpm build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
pnpm preview
```

## 🌐 GitHub Pages Deployment

The application is configured to deploy to GitHub Pages at `https://<username>.github.io/threejs/`.

### Setup Instructions

1. **Create a GitHub repository** named `threejs` (or your preferred name)
2. **Push your code** to the repository:
   ```bash
   git remote add origin https://github.com/<username>/threejs.git
   git branch -M main
   git push -u origin main
   ```

3. **Enable GitHub Pages**:
   - Go to your repository Settings → Pages
   - Under "Source", select "GitHub Actions"
   - The workflow will automatically deploy on every push to `main`

4. **Update base path** (if needed):
   - If your repository has a different name, update `base` in `vite.config.ts`:
     ```typescript
     base: "/your-repo-name/",
     ```

### Automatic Deployment

The repository includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that:
- Automatically builds the project on every push to `main`
- Deploys to GitHub Pages
- Uses pnpm for dependency management
- Runs TypeScript compilation and Vite build

### Manual Deployment

If you prefer manual deployment:

```bash
pnpm build
# Then copy the contents of dist/ to your gh-pages branch
```

**Note**: The base path in `vite.config.ts` is set to `/threejs/` for GitHub Pages. If your repository name is different, update this path accordingly.

## ✨ Features

### Core Functionality

- **Hierarchical Model Tree**: Create nested assemblies with unlimited depth
- **Geometric Primitives**: Box, Cylinder, Cone, Sphere, Torus, Pyramid
- **3D Visualization**: Real-time rendering with soft shadows and edge highlighting
- **Drag and Drop**: Reorder components within the tree hierarchy
- **Property Editing**: Full control over transforms, size, and color
- **Click-to-Select**: Select objects from either the tree view or 3D view
- **Undo/Redo**: Full history support with 50-step undo/redo (Ctrl+Z / Ctrl+Y)
- **Command Palette**: Quick access to all nodes and actions (Cmd+K / Ctrl+K)

### Advanced Features

- **Keyboard Shortcuts**: 
  - `Delete` / `Backspace`: Delete selected item
  - `Ctrl+Z` / `Cmd+Z`: Undo
  - `Ctrl+Shift+Z` / `Ctrl+Y` / `Cmd+Shift+Z` / `Cmd+Y`: Redo
  - `Cmd+K` / `Ctrl+K`: Open command palette

- **Smart Property Editing**:
  - Drag-to-adjust on X/Y/Z labels (0.1 units per pixel, 0.01 with Shift)
  - Linked fields for maintaining ratios across axes
  - Rotation in degrees with automatic -180° to 180° wrapping
  - Auto-select all text on input focus
  - Formatted number display (always 2 decimal places)

- **Visual Enhancements**:
  - Soft shadows with configurable opacity
  - Edge rendering on all meshes (green when selected)
  - Prominent 3D axes helper
  - Color-coded X/Y/Z inputs (red/green/blue)
  - Floating panels with smooth collapse/expand animations

- **Node Management**:
  - Context menu (rename, duplicate, delete)
  - Visibility toggle with eye icon
  - Auto-selection of newly added primitives
  - Type-specific icons for each primitive
  - Truncated long names with ellipsis

## 🏗️ Architecture

### State Management

The application uses **React Context + useReducer** for state management, providing:

- Centralized state store with type-safe actions
- History tracking for undo/redo (50-step limit)
- Immutable state updates
- Efficient re-rendering with React's built-in optimization

**State Structure:**
```typescript
interface ModelState {
  model: Model;              // Hierarchical node tree
  selection: SelectionState; // Current selection
  history: ModelState[];     // Undo/redo history
  historyIndex: number;      // Current position in history
}
```

### Component Architecture

```
src/
├── components/
│   ├── ModelTree/          # Hierarchical tree view with drag-and-drop
│   │   ├── ModelTree.tsx   # Main tree container (floating panel)
│   │   ├── TreeNode.tsx    # Individual node with context menu
│   │   └── TreeControls.tsx # Add primitive/assembly buttons
│   │
│   ├── View3D/             # Three.js 3D visualization
│   │   ├── View3D.tsx      # Scene setup, lighting, shadows
│   │   ├── ModelObject.tsx # Renders node as 3D mesh
│   │   └── SceneGraph.tsx  # Recursive scene rendering
│   │
│   ├── PropertyPanel/       # Property editing interface
│   │   ├── PropertyPanel.tsx # Main panel (floating)
│   │   └── PropertyInput.tsx # Drag-to-adjust number inputs
│   │
│   ├── PrimitiveSelector/   # Icon-based primitive picker
│   ├── CommandPalette.tsx  # Command palette (Cmd+K)
│   ├── KeyboardHandler.tsx # Global keyboard shortcuts
│   └── ui/                 # shadcn/ui components
│
├── store/
│   ├── ModelStore.tsx      # React Context provider
│   └── modelActions.ts     # Reducer and action types
│
├── types/
│   ├── model.ts           # Core data model types
│   ├── primitives.ts      # Primitive type definitions
│   └── threejs.ts         # Three.js type extensions
│
├── utils/
│   ├── treeUtils.ts       # Tree manipulation utilities
│   ├── threejsHelpers.ts  # Three.js geometry/material helpers
│   ├── nameGenerator.ts  # Auto-naming for primitives/assemblies
│   └── uuid.ts            # ID generation
│
└── constants/
    └── primitives.ts      # Primitive defaults and definitions
```

### Data Model

The application uses a hierarchical tree structure:

- **AssemblyNode**: Container nodes that can hold primitives and other assemblies
- **PrimitiveNode**: Leaf nodes representing actual 3D geometry
- **Transform**: Position, rotation (degrees), and scale for each node
- **Selection**: Synchronized between tree view and 3D view

All nodes support:
- Transform (position, rotation, scale)
- Visibility toggle
- Rename operation
- Drag-and-drop reordering
- Duplication (recursive for assemblies)

## 📚 Technology Stack

### Core Framework
- **React 19.1.1** - UI framework with latest features
- **TypeScript 5.9.3** - Type safety and developer experience
- **Vite 7.1.7** - Fast build tool and dev server

### 3D Graphics
- **Three.js 0.181.0** - Core 3D graphics library
- **@react-three/fiber 9.4.0** - React renderer for Three.js
- **@react-three/drei 10.7.6** - Useful helpers (OrbitControls, Grid, etc.)

### UI Components
- **shadcn/ui** - Accessible component library built on Radix UI
- **Tailwind CSS 3.4.0** - Utility-first CSS framework
- **Lucide React** - Icon library
- **cmdk** - Command palette component

### Drag and Drop
- **@dnd-kit/core** - Modern drag-and-drop library
- **@dnd-kit/sortable** - Sortable list functionality
- **@dnd-kit/utilities** - Utility functions

### State Management
- **React Context API** - Built-in state management
- **useReducer** - Reducer pattern for complex state

## 🎨 Key Implementation Details

### Undo/Redo System

The undo/redo system maintains a history stack of state snapshots:

- **History Limit**: 50 entries (configurable)
- **Auto-save**: Every action (except selection) is saved to history
- **State Snapshots**: Deep clones of model state (without history itself)
- **History Trimming**: Future history is discarded when new actions occur after undo

### Shadow System

- **Soft Shadows**: PCFSoftShadowMap with configurable radius (20px blur)
- **Light Setup**: Multiple directional lights + ambient light
- **Shadow Material**: Light shadow opacity (0.2) for subtle depth
- **Ground Plane**: Invisible plane receives shadows

### Drag-to-Adjust

Property inputs support drag-to-adjust on labels:

- **Sensitivity**: 0.1 units per pixel (default), 0.01 with Shift
- **Threshold**: 3px movement before drag starts (prevents accidental drags)
- **Visual Feedback**: Cursor changes to `ew-resize` on hover

### Number Formatting

All numeric inputs:
- Display exactly 2 decimal places (e.g., `2.90`, `0.00`)
- Support drag-to-adjust on labels
- Auto-select all text on focus
- Validate and format on blur

### Color System

Primitives support custom colors:
- **Default**: White (#ffffff)
- **Selection**: Green tint overlay with emissive glow
- **Edges**: Green when selected, dark gray otherwise
- **Color Picker**: Native color input + hex text field

## 🎯 Usage Guide

### Adding Primitives

1. Click "Add Primitive" button in the Model Tree panel
2. Select a primitive type from the icon grid
3. The primitive is automatically named (Mesh 1, Mesh 2, etc.) and selected

### Adding Assemblies

1. Click "Add Assembly" button in the Model Tree panel
2. Assembly is created with auto-generated name (Assembly 1, Assembly 2, etc.)

### Managing Nodes

- **Select**: Click on node in tree or 3D view
- **Rename**: Right-click → Rename (or use context menu)
- **Duplicate**: Right-click → Duplicate
- **Delete**: Right-click → Delete, or press `Delete` key
- **Toggle Visibility**: Click eye icon in tree
- **Reorder**: Drag nodes in tree to reorder within parent

### Editing Properties

1. Select a node (primitive or assembly)
2. Edit properties in the right panel:
   - **Name**: Text input (auto-selects on focus)
   - **Position**: X, Y, Z inputs (drag labels to adjust)
   - **Rotation**: X, Y, Z in degrees (-180° to 180°)
   - **Scale/Size**: Unified size control for primitives, scale for assemblies
   - **Color**: Color picker + hex input (primitives only)

### Keyboard Shortcuts

- `Cmd+K` / `Ctrl+K`: Open command palette
- `Delete` / `Backspace`: Delete selected node
- `Ctrl+Z` / `Cmd+Z`: Undo last action
- `Ctrl+Y` / `Ctrl+Shift+Z` / `Cmd+Y` / `Cmd+Shift+Z`: Redo

### 3D View Controls

- **Orbit**: Left-click and drag to rotate camera
- **Pan**: Right-click and drag (or middle mouse button)
- **Zoom**: Scroll wheel
- **Select**: Click on objects in 3D view
- **Deselect**: Click on empty space

## 🔧 Development

### Code Quality

- **ESLint**: Configured with React and TypeScript rules
- **TypeScript**: Strict type checking enabled
- **React Hooks**: All hooks follow Rules of Hooks (no conditional calls)

### Project Structure Philosophy

- **Separation of Concerns**: UI components, state management, and utilities are clearly separated
- **Type Safety**: Full TypeScript coverage with strict types
- **Reusability**: Shared utilities and components where appropriate
- **Performance**: React.memo and useMemo where beneficial

### Adding New Features

1. **New Primitive Type**: Add to `PrimitiveType` in `types/model.ts`, add geometry in `threejsHelpers.ts`, add defaults in `constants/primitives.ts`
2. **New Action**: Add action type to `ModelAction` union, implement case in reducer
3. **New Component**: Follow existing component structure, use shadcn/ui components

## 📝 Implementation Notes

### Design Decisions

1. **State Management**: Chose React Context + useReducer over Zustand/Redux for simplicity and zero dependencies
2. **3D Rendering**: Used React Three Fiber for better React integration vs vanilla Three.js
3. **UI Library**: shadcn/ui chosen for accessibility and full customization control
4. **Drag-and-Drop**: @dnd-kit selected for modern API and better performance than react-beautiful-dnd
5. **History System**: Deep cloning approach for simplicity (could optimize with immutable libraries later)

### Performance Considerations

- **History Limit**: 50 entries prevents memory issues
- **State Cloning**: JSON.parse/stringify for deep cloning (acceptable for <1000 nodes)
- **Memoization**: useMemo for expensive geometry/material calculations
- **Selective Rendering**: Only re-renders affected components on state changes

## 🚧 Future Enhancements

Potential features for future development:

- [ ] Export/Import models (JSON, STL, OBJ)
- [ ] 3D transform gizmos (visual handles for manipulation)
- [ ] Multi-selection (Ctrl+Click)
- [ ] Copy/Paste (Ctrl+C / Ctrl+V)
- [ ] Focus camera on selection (F key)
- [ ] Grid snapping
- [ ] Material editor (roughness, metalness, textures)
- [ ] Animation timeline
- [ ] Multiple viewports (top, front, side views)
- [ ] Measurement tools

## 📄 License

MIT
