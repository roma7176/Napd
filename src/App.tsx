import { Route, Routes } from "react-router-dom";
import { Nav } from "./components/Nav";
import { Landing } from "./pages/Landing";
import { CaseSelection } from "./pages/CaseSelection";
import { ActiveDefense } from "./pages/ActiveDefense";
import { Results } from "./pages/Results";
import { NotFound } from "./pages/NotFound";

function App() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <Nav />
      <main>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/cases" element={<CaseSelection />} />
          <Route path="/session/:caseId" element={<ActiveDefense />} />
          <Route path="/results/:sessionId" element={<Results />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
