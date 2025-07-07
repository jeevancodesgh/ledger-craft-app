import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import AddToHomeScreenPrompt from "@/components/common/AddToHomeScreenPrompt";
import { ThemeProvider } from "@/context/ThemeContext";
import { usePwaUpdatePrompt } from "@/hooks/usePwaUpdatePrompt";
import PwaUpdatePrompt from "@/components/common/PwaUpdatePrompt";

function App() {
  const { needRefresh, promptUpdate, dismissPrompt } = usePwaUpdatePrompt();
  return (
    <ThemeProvider defaultTheme="system" storageKey="easybizinvoice-theme">
      <RouterProvider router={router} />
      <PwaUpdatePrompt open={needRefresh} onUpdate={promptUpdate} onClose={dismissPrompt} />
      <AddToHomeScreenPrompt />
    </ThemeProvider>
  );
}

export default App;
