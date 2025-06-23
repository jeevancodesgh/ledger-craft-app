import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import AddToHomeScreenPrompt from "@/components/common/AddToHomeScreenPrompt";

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <AddToHomeScreenPrompt />
    </>
  );
}

export default App;
