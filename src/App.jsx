import React from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ScreenProvider } from "./context/ScreenContext";
import { ToastContainer } from "./components/common/ToastContainer";
import { SplashScreen } from "./components/common/SplashScreen";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { AppRoutes } from "./routes/AppRoutes";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <ScreenProvider>
            <SplashScreen />
            <ErrorBoundary>
              <AppRoutes />
            </ErrorBoundary>
            <ToastContainer />
          </ScreenProvider>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
