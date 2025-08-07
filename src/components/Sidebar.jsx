import React from 'react';
import { 
  Home, 
  Target, 
  Trophy, 
  Users, 
  FileText,
  Settings,
  HelpCircle
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'resume', label: 'Resume Builder', icon: FileText },
    { id: 'assessment', label: 'Skill Assessment', icon: Target },
    { id: 'hackathons', label: 'Hackathons', icon: Trophy },
    { id: 'leaderboard', label: 'Leaderboard', icon: Users },
  ];

  return (
    <aside className="w-64 bg-white shadow-lg border-r border-gray-200 min-h-screen">
      <div className="p-6">
        {/* Navigation Items */}
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon 
                  size={20} 
                  className={isActive ? 'text-blue-600' : 'text-gray-400'} 
                />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
        
        {/* Bottom Section */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="space-y-2">
            <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200">
              <Settings size={20} className="text-gray-400" />
              <span className="font-medium">Settings</span>
            </button>
            
            <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200">
              <HelpCircle size={20} className="text-gray-400" />
              <span className="font-medium">Help & Support</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}