import { ModelProvider } from "@/store/ModelStore";
import { ModelTree } from "@/components/ModelTree/ModelTree";
import { View3D } from "@/components/View3D/View3D";
import { PropertyPanel } from "@/components/PropertyPanel/PropertyPanel";
import { CommandPalette } from "@/components/CommandPalette";
import { KeyboardHandler } from "@/components/KeyboardHandler";

function App() {
  return (
    <ModelProvider>
      <KeyboardHandler />
      <div className="h-screen w-screen relative overflow-hidden">
        <View3D />
        <ModelTree />
        <PropertyPanel />
        <CommandPalette />
      </div>
    </ModelProvider>
  );
}

export default App;
