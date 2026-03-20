import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Ensure dark mode is always applied
document.documentElement.classList.add("dark");

createRoot(document.getElementById("root")!).render(<App />);
