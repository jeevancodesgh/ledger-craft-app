import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import AddToHomeScreenPrompt from "@/components/common/AddToHomeScreenPrompt";
import { ThemeProvider } from "@/context/ThemeContext";
import { ConversationProvider } from "@/context/ConversationContext";

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="ledger-craft-theme">
      <ConversationProvider>
        <RouterProvider router={router} />
        <AddToHomeScreenPrompt />
      </ConversationProvider>
    </ThemeProvider>
  );
}

export default App;
