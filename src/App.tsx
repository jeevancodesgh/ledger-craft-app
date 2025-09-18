import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import AddToHomeScreenPrompt from "@/components/common/AddToHomeScreenPrompt";
import { ThemeProvider } from "@/context/ThemeContext";
import { usePwaUpdatePrompt } from "@/hooks/usePwaUpdatePrompt";
import PwaUpdatePrompt from "@/components/common/PwaUpdatePrompt";
import DeveloperTools from "@/components/common/DeveloperTools";
import { useDeveloperTools } from "@/hooks/useDeveloperTools";

function App() {
  const { needRefresh, promptUpdate, forceUpdate, clearCaches, dismissPrompt } = usePwaUpdatePrompt();
  const { isOpen: devToolsOpen, close: closeDevTools } = useDeveloperTools();
  
  return (
    <ThemeProvider defaultTheme="system" storageKey="easybizinvoice-theme">
      <RouterProvider router={router} />
      <PwaUpdatePrompt 
        open={needRefresh} 
        onUpdate={promptUpdate}
        onForceUpdate={forceUpdate}
        onClearCaches={clearCaches}
        onClose={dismissPrompt} 
      />
      <AddToHomeScreenPrompt />
      <DeveloperTools 
        isOpen={devToolsOpen} 
        onClose={closeDevTools} 
      />
    </ThemeProvider>
  );
}

export default App;
