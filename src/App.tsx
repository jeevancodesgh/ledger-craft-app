import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import AddToHomeScreenPrompt from "@/components/common/AddToHomeScreenPrompt";
import { ThemeProvider } from "@/context/ThemeContext";

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="easybizinvoice-theme">
      <RouterProvider router={router} />
      <AddToHomeScreenPrompt />
    </ThemeProvider>
  );
}

export default App;
