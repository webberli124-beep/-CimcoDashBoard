import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardPage from "./pages/dashboard-page";

function App() {
  return (
    <div className="dark">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
