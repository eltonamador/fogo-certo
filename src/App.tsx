import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";

// Pages
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import AvisosPage from "./pages/AvisosPage";
import CalendarioPage from "./pages/CalendarioPage";
import DisciplinasPage from "./pages/DisciplinasPage";
import MateriaisPage from "./pages/MateriaisPage";
import FrequenciaPage from "./pages/FrequenciaPage";
import AvaliacoesPage from "./pages/AvaliacoesPage";
import TarefasPage from "./pages/TarefasPage";
import RelatoriosPage from "./pages/RelatoriosPage";
import ConfiguracoesPage from "./pages/ConfiguracoesPage";
import MinhaSituacaoPage from "./pages/MinhaSituacaoPage";
import AdminUsuariosPage from "./pages/admin/UsuariosPage";
import AdminPelotoesPage from "./pages/admin/PelotoesPage";
import AdminTurmasPage from "./pages/admin/TurmasPage";
import AdminRelatoriosPage from "./pages/admin/RelatoriosPage";
import AlertasPage from "./pages/AlertasPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/auth" replace />} />
            <Route path="/auth" element={<AuthPage />} />
            
            {/* Protected Routes */}
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/avisos" element={<AvisosPage />} />
              <Route path="/calendario" element={<CalendarioPage />} />
              <Route path="/disciplinas" element={<DisciplinasPage />} />
              <Route path="/materiais" element={<MateriaisPage />} />
              <Route path="/frequencia" element={<FrequenciaPage />} />
              <Route path="/avaliacoes" element={<AvaliacoesPage />} />
              <Route path="/tarefas" element={<TarefasPage />} />
              <Route path="/relatorios" element={<RelatoriosPage />} />
              <Route path="/configuracoes" element={<ConfiguracoesPage />} />
              <Route path="/minha-situacao" element={<MinhaSituacaoPage />} />
              <Route path="/alertas" element={<AlertasPage />} />
              <Route path="/admin/usuarios" element={<AdminUsuariosPage />} />
              <Route path="/admin/pelotoes" element={<AdminPelotoesPage />} />
              <Route path="/admin/turmas" element={<AdminTurmasPage />} />
              <Route path="/admin/relatorios" element={<AdminRelatoriosPage />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
