// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
// import ErrorBoundary from "./components/ErrorBoundary"; // 👈 COMENTAR TEMPORALMENTE
import { Toaster } from "react-hot-toast";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* <ErrorBoundary> */}  {/* 👈 COMENTAR */}
      <App />
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1e293b',
            color: '#fff',
            border: '1px solid #f59e0b',
          },
        }}
      />
    {/* </ErrorBoundary> */}  {/* 👈 COMENTAR */}
  </React.StrictMode>
);