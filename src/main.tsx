import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
// חוקי ההיפוך הכהה חיים בקובץ נפרד כדי ש-@apply של Tailwind לא ישאב אותם
import "./styles/fonts.css";
import "./styles/dark-overrides.css";

// VITE_HASH_ROUTER=1 builds a self-contained preview that runs from any path.
const Router = import.meta.env.VITE_HASH_ROUTER === "1" ? HashRouter : BrowserRouter;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Router>
      <App />
    </Router>
  </StrictMode>
);
