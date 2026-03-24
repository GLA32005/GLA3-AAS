import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { Dashboard } from './components/Dashboard';
import { AlertsPage } from './components/AlertsPage';
import { AgentsPage } from './components/AgentsPage';
import { RulesPage } from './components/RulesPage';
import { SettingsPage } from './components/SettingsPage';

import { ReportPage } from './components/ReportPage';

import { useEffect } from 'react';
import axios from 'axios';
import { LoginPage } from './components/LoginPage';
import { AlertDetailView } from './components/AlertDetailView';
import { AccessWizardPage } from './components/AccessWizardPage';
import { PermissionsPage } from './components/PermissionsPage';
import { AuditLogPage } from './components/AuditLogPage';
import { CompliancePage } from './components/CompliancePage';
import { API_ENDPOINTS } from './lib/api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!localStorage.getItem('agentsec_token'));
  const [activePage, setActivePage] = useState('overview');
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null);
  const [alertCount, setAlertCount] = useState(0);
  const [agentCount, setAgentCount] = useState(0);

  const fetchCounters = async () => {
    try {
      // 1. 获取未处理告警数 (添加 status=open 过滤)
      const alertsRes = await axios.get(`${API_ENDPOINTS.ALERTS}?status=open`);
      if (alertsRes.data && alertsRes.data.alerts) {
        setAlertCount(alertsRes.data.alerts.length);
      }
      
      // 2. 获取 Agent 数 (需解析 .agents 数组)
      const agentsRes = await axios.get(API_ENDPOINTS.AGENTS);
      if (agentsRes.data && agentsRes.data.agents) {
        setAgentCount(agentsRes.data.agents.length);
      }
    } catch (err) {
      console.error("Failed to fetch sidebar counters:", err);
    }
  };

  useEffect(() => {
    fetchCounters(); // Initial fetch
    
    // 提高轮询频率至 15s 以获得更及时的反馈
    const interval = setInterval(() => {
      if (localStorage.getItem('agentsec_token')) {
        fetchCounters();
      }
    }, 15000);

    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          handleLogout();
        }
        return Promise.reject(error);
      }
    );
    return () => {
      axios.interceptors.response.eject(interceptor);
      clearInterval(interval);
    };
  }, []);

  const handleLogin = (token: string) => {
    localStorage.setItem('agentsec_token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('agentsec_token');
    delete axios.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLogin} />;
  }

  const handleViewReport = (agentName: string) => {
    setSelectedAgent(agentName);
    setActivePage('report'); // Changed from 'agent_report' to 'report'
  };

  const handleViewAlert = (alertId: string) => {
    setSelectedAlert(alertId);
    setActivePage('alert_detail');
  };

  return (
    <div className="flex h-screen bg-[#f9fafb] text-zinc-800 overflow-hidden font-sans">
      <Sidebar activePage={activePage} setActivePage={setActivePage} onLogout={handleLogout} alertCount={alertCount} agentCount={agentCount} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar activePage={activePage} />
        
        <main className="flex-1 overflow-auto bg-[#f9fafb]">
          {activePage === 'overview' && <Dashboard />}
          {activePage === 'alerts' && (
            <AlertsPage 
              onViewDetail={handleViewAlert} 
              onActionSuccess={fetchCounters} 
            />
          )}
          {activePage === 'agents' && <AgentsPage onViewReport={handleViewReport} />}
          {activePage === 'rules' && <RulesPage />}
          {activePage === 'settings' && <SettingsPage />}
          {activePage === 'register' && <AccessWizardPage />}
          {activePage === 'permissions' && <PermissionsPage />}
          {activePage === 'audit' && <AuditLogPage />}
          {activePage === 'compliance' && <CompliancePage />}
          {activePage === 'report' && (
            <ReportPage 
              agentName={selectedAgent || undefined} 
              onBack={() => {
                setActivePage('agents');
                setSelectedAgent(null);
              }} 
            />
          )}
          {activePage === 'alert_detail' && (
            <AlertDetailView 
              alertId={selectedAlert || undefined} 
              onBack={() => {
                setActivePage('alerts');
                setSelectedAlert(null);
              }} 
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
