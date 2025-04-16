import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Set the direction to RTL for the entire app
document.documentElement.dir = "rtl";
document.documentElement.lang = "he";

createRoot(document.getElementById("root")!).render(<App />);
