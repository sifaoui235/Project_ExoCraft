import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/home";
import Login from "./pages/Login";
import Register from "./pages/register";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import AiGenerator from "./pages/AiGenerator";
import QuizManager from "./pages/QuizManager";
import ContentManager from "./pages/ContentManager";
import ArchivesAdmin from "./pages/ArchivesAdmin";
import AdminDashboard from "./pages/AdminDashboard";
import "./App.css";
import "./layout.css";
import "./workspace.css";

const legacyPaths = [
  "/my-content", "/history", "/generator", "/documents", "/create-quiz", "/my-quizzes",
  "/generated-quiz", "/generated-course", "/generated-exam", "/generated-exercises",
  "/quiz-result", "/course-result",
];

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/archives" element={<ProtectedRoute><ArchivesAdmin /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/ai" element={<ProtectedRoute><AiGenerator /></ProtectedRoute>} />
        <Route path="/quiz" element={<ProtectedRoute><QuizManager /></ProtectedRoute>} />
        <Route path="/contents" element={<ProtectedRoute><ContentManager /></ProtectedRoute>} />
        <Route path="/archives-admin" element={<ProtectedRoute><ArchivesAdmin /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        {legacyPaths.map(path => <Route key={path} path={path} element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />)}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
