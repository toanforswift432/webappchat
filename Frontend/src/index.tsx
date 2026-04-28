import React from "react";
import "./index.css";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { store } from "./store";
import { injectStore } from "./services/axios";
import { App } from "./App";
import { VerifyAccountPage } from "./pages/VerifyAccountPage";
import { SetPasswordPage } from "./pages/SetPasswordPage";
import { AdminLoginPage } from "./pages/AdminLoginPage";
import { AdminDashboard } from "./pages/AdminDashboard";
import { LanguageProvider } from "./i18n/LanguageContext";

injectStore(store);

const container = document.getElementById("root")!;
createRoot(container).render(
  <Provider store={store}>
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          {/* Admin Portal Routes */}
          <Route path="/adminstractor" element={<AdminLoginPage />} />
          <Route path="/adminstractor/dashboard" element={<AdminDashboard />} />

          {/* User Portal Routes */}
          <Route path="/webappchat/verify-account/:token" element={<VerifyAccountPage />} />
          <Route path="/webappchat/set-password/:userId" element={<SetPasswordPage />} />
          <Route path="/webappchat/*" element={<App />} />

          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/webappchat" replace />} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  </Provider>,
);
