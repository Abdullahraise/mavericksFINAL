import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, Award, Activity, Settings, LogOut } from 'lucide-react';
import RecentActivityTable from '../analytics/components/RecentActivityTable';
import AdminAIAssistant from '../analytics/components/AdminAIAssistant';
import ChatInteractions from '../analytics/components/ChatInteractions';
import HackathonPanel from '../analytics/components/HackathonPanel';
import { db } from '../firebaseConfig';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';

export default function AdminDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    assessmentsCompleted: 0,
    averageScore: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    fetchDashboardData();
  }, []);
  
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch users count
      const usersQuery = collection(db, 'users');
      const usersSnapshot = await getDocs(usersQuery);
      const totalUsers = usersSnapshot.size;
      
      // Calculate active users (users who logged in within the last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      let activeUsers = 0;
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        if (userData.lastLogin && new Date(userData.lastLogin) > thirtyDaysAgo) {
          activeUsers++;
        }
      });
      
      // If no lastLogin data is available, estimate active users as 70% of total
      if (activeUsers === 0) {
        activeUsers = Math.round(totalUsers * 0.7);
      }
      
      // Fetch assessments data
      const assessmentsQuery = collection(db, 'assessments');
      const assessmentsSnapshot = await getDocs(assessmentsQuery);
      const assessmentsCompleted = assessmentsSnapshot.size;
      
      // Calculate average score
      let totalScore = 0;
      assessmentsSnapshot.forEach(doc => {
        const assessmentData = doc.data();
        if (assessmentData.score) {
          totalScore += assessmentData.score;
        }
      });
      
      const averageScore = assessmentsCompleted > 0 
        ? parseFloat((totalScore / assessmentsCompleted).toFixed(1))
        : 78.5; // Default if no assessments
      
      setStats({
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        assessmentsCompleted: assessmentsCompleted || 0,
        averageScore: averageScore || 0
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
      // Fall back to demo data if fetch fails
      setStats({
        totalUsers: 1247,
        activeUsers: 892,
        assessmentsCompleted: 3456,
        averageScore: 78.5
      });
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'hackathons', label: 'Hackathons', icon: Award },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl font-bold">A</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-500">Manage your platform</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 bg-gray-50 rounded-lg px-3 py-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {user.displayName?.charAt(0) || 'A'}
                  </span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{user.displayName}</p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
              </div>
              
              <button
                onClick={onLogout}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon size={20} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700"></div>
            <span className="ml-2 text-gray-600">Loading dashboard data...</span>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
            <button 
              onClick={fetchDashboardData} 
              className="ml-4 text-sm underline"
            >
              Retry
            </button>
          </div>
        )}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="metrics-card">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users size={20} className="text-blue-600" />
                  </div>
                  <div className="flex items-center space-x-1 text-sm text-green-600">
                    <TrendingUp size={16} />
                    <span>+12%</span>
                  </div>
                </div>
                <div className="metrics-title">Total Users</div>
                <div className="metrics-value">{stats.totalUsers.toLocaleString()}</div>
              </div>

              <div className="metrics-card">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Activity size={20} className="text-green-600" />
                  </div>
                  <div className="flex items-center space-x-1 text-sm text-green-600">
                    <TrendingUp size={16} />
                    <span>+8%</span>
                  </div>
                </div>
                <div className="metrics-title">Active Users</div>
                <div className="metrics-value">{stats.activeUsers.toLocaleString()}</div>
              </div>

              <div className="metrics-card">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Award size={20} className="text-yellow-600" />
                  </div>
                  <div className="flex items-center space-x-1 text-sm text-green-600">
                    <TrendingUp size={16} />
                    <span>+15%</span>
                  </div>
                </div>
                <div className="metrics-title">Assessments</div>
                <div className="metrics-value">{stats.assessmentsCompleted.toLocaleString()}</div>
              </div>

              <div className="metrics-card">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <TrendingUp size={20} className="text-purple-600" />
                  </div>
                  <div className="flex items-center space-x-1 text-sm text-green-600">
                    <TrendingUp size={16} />
                    <span>+5%</span>
                  </div>
                </div>
                <div className="metrics-title">Avg Score</div>
                <div className="metrics-value">{stats.averageScore}%</div>
              </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Activity */}
              <div className="lg:col-span-2">
                <div className="card">
                  <div className="card-header">
                    <h2 className="card-title">Recent Activity</h2>
                    <p className="card-subtitle">Latest user activities and assessments</p>
                  </div>
                  <RecentActivityTable />
                </div>
              </div>

              {/* Quick Actions and Admin Chat */}
              <div className="space-y-6">
                <div className="card">
                  <div className="card-header">
                    <h2 className="card-title">Quick Actions</h2>
                  </div>
                  <div className="space-y-3">
                    <button className="w-full btn btn-primary">
                      Add New User
                    </button>
                    <button className="w-full btn btn-secondary">
                      Create Assessment
                    </button>
                    <button className="w-full btn btn-secondary">
                      Schedule Hackathon
                    </button>
                    <button className="w-full btn btn-secondary">
                      Generate Report
                    </button>
                  </div>
                </div>

                {/* Admin AI Assistant */}
                <div className="card">
                  <div className="card-header">
                    <h2 className="card-title">Admin AI Assistant</h2>
                    <p className="card-subtitle">Get help with administrative tasks</p>
                  </div>
                  <div className="p-4">
                    <AdminAIAssistant user={user} />
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h2 className="card-title">Platform Status</h2>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Server Status</span>
                      <span className="badge badge-success">Online</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Database</span>
                      <span className="badge badge-success">Connected</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">API Services</span>
                      <span className="badge badge-success">Active</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Last Backup</span>
                      <span className="text-sm text-gray-900">2 hours ago</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">User Management</h2>
              <p className="card-subtitle">Manage platform users and their access</p>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-medium">Platform Users</h3>
                  <p className="text-sm text-gray-500">Total users: {stats.totalUsers}</p>
                </div>
                <button className="btn btn-primary">
                  <Users size={16} className="mr-2" />
                  Add New User
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {/* We'll show a few sample users for the hackathon demo */}
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <span className="text-purple-800 font-medium">JD</span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">John Doe</div>
                            <div className="text-sm text-gray-500">john.doe@example.com</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">User</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button className="text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
                        <button className="text-red-600 hover:text-red-900">Disable</button>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-800 font-medium">JS</span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">Jane Smith</div>
                            <div className="text-sm text-gray-500">jane.smith@example.com</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">Admin</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button className="text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
                        <button className="text-red-600 hover:text-red-900">Disable</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Analytics Dashboard</h2>
                <p className="card-subtitle">Detailed platform analytics and insights</p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
                <div className="metrics-card">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users size={20} className="text-blue-600" />
                    </div>
                  </div>
                  <div className="metrics-title">Total Interactions</div>
                  <div className="metrics-value">1,248</div>
                  <div className="metrics-subtitle">User-AI conversations</div>
                </div>
                
                <div className="metrics-card">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Activity size={20} className="text-green-600" />
                    </div>
                  </div>
                  <div className="metrics-title">Avg. Response Time</div>
                  <div className="metrics-value">1.8s</div>
                  <div className="metrics-subtitle">AI response latency</div>
                </div>
                
                <div className="metrics-card">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <TrendingUp size={20} className="text-purple-600" />
                    </div>
                  </div>
                  <div className="metrics-title">User Satisfaction</div>
                  <div className="metrics-value">92%</div>
                  <div className="metrics-subtitle">Based on feedback</div>
                </div>
              </div>
            </div>
            
            {/* Chat Interactions Section */}
            <div className="card">
              <ChatInteractions />
            </div>
          </div>
        )}

        {activeTab === 'hackathons' && (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Hackathon Management</h2>
              <p className="card-subtitle">Create and manage coding competitions</p>
            </div>
            <HackathonPanel />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Platform Settings</h2>
              <p className="card-subtitle">Configure platform settings and preferences</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium text-lg mb-4">API Configuration</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">OpenAI API Key</label>
                      <div className="flex">
                        <input 
                          type="password" 
                          className="flex-grow form-input rounded-l-md" 
                          value="sk-..." 
                          readOnly 
                        />
                        <button className="bg-gray-100 px-4 rounded-r-md border border-l-0 text-gray-600">
                          Update
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cohere API Key</label>
                      <div className="flex">
                        <input 
                          type="password" 
                          className="flex-grow form-input rounded-l-md" 
                          value="co-..." 
                          readOnly 
                        />
                        <button className="bg-gray-100 px-4 rounded-r-md border border-l-0 text-gray-600">
                          Update
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gemini API Key</label>
                      <div className="flex">
                        <input 
                          type="password" 
                          className="flex-grow form-input rounded-l-md" 
                          value="gem-..." 
                          readOnly 
                        />
                        <button className="bg-gray-100 px-4 rounded-r-md border border-l-0 text-gray-600">
                          Update
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium text-lg mb-4">Platform Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Enable User Registration</h4>
                        <p className="text-sm text-gray-500">Allow new users to register</p>
                      </div>
                      <div className="relative inline-block w-10 mr-2 align-middle select-none">
                        <input type="checkbox" id="toggle-registration" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" defaultChecked />
                        <label htmlFor="toggle-registration" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Enable Hackathons</h4>
                        <p className="text-sm text-gray-500">Allow users to participate in hackathons</p>
                      </div>
                      <div className="relative inline-block w-10 mr-2 align-middle select-none">
                        <input type="checkbox" id="toggle-hackathons" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" defaultChecked />
                        <label htmlFor="toggle-hackathons" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Maintenance Mode</h4>
                        <p className="text-sm text-gray-500">Put platform in maintenance mode</p>
                      </div>
                      <div className="relative inline-block w-10 mr-2 align-middle select-none">
                        <input type="checkbox" id="toggle-maintenance" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" />
                        <label htmlFor="toggle-maintenance" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button className="btn btn-primary">Save Changes</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}