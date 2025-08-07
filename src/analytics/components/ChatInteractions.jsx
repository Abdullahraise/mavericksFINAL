import React, { useState, useEffect } from 'react';

export default function ChatInteractions() {
  const [chatHistory, setChatHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [selectedUser, setSelectedUser] = useState('');
  const [uniqueUsers, setUniqueUsers] = useState([]);

  useEffect(() => {
    // In a real app, this would fetch from Firestore
    // For demo, we'll use localStorage
    const history = JSON.parse(localStorage.getItem('admin_chat_history') || '[]');
    setChatHistory(history);
    setFilteredHistory(history);

    // Extract unique users for filtering
    const users = [...new Set(history.map(item => item.userName))];
    setUniqueUsers(users);
  }, []);

  useEffect(() => {
    let filtered = [...chatHistory];

    // Apply search term filter
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.userMessage.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.aiResponse.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply date range filter
    if (dateFilter.start) {
      filtered = filtered.filter(item => 
        new Date(item.timestamp) >= new Date(dateFilter.start)
      );
    }
    if (dateFilter.end) {
      filtered = filtered.filter(item => 
        new Date(item.timestamp) <= new Date(dateFilter.end)
      );
    }

    // Apply user filter
    if (selectedUser) {
      filtered = filtered.filter(item => item.userName === selectedUser);
    }

    setFilteredHistory(filtered);
  }, [searchTerm, dateFilter, selectedUser, chatHistory]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setDateFilter({ start: '', end: '' });
    setSelectedUser('');
  };

  const handleExportData = () => {
    // Create CSV content
    const csvContent = [
      ['User', 'Message', 'AI Response', 'Timestamp'].join(','),
      ...filteredHistory.map(item => [
        item.userName,
        `"${item.userMessage.replace(/"/g, '""')}"`,
        `"${item.aiResponse.replace(/"/g, '""')}"`,
        item.timestamp
      ].join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `chat_interactions_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="chat-interactions-container">
      <div className="chat-interactions-header">
        <h2 className="card-title">User Chat Interactions</h2>
        <p className="card-subtitle">Monitor and analyze user conversations with the AI assistant</p>
      </div>

      <div className="chat-interactions-filters">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Search in messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <select 
            value={selectedUser} 
            onChange={(e) => setSelectedUser(e.target.value)}
            className="user-select"
          >
            <option value="">All Users</option>
            {uniqueUsers.map((user, index) => (
              <option key={index} value={user}>{user}</option>
            ))}
          </select>
        </div>

        <div className="filter-group date-filters">
          <input
            type="date"
            value={dateFilter.start}
            onChange={(e) => setDateFilter({...dateFilter, start: e.target.value})}
            className="date-input"
          />
          <span>to</span>
          <input
            type="date"
            value={dateFilter.end}
            onChange={(e) => setDateFilter({...dateFilter, end: e.target.value})}
            className="date-input"
          />
        </div>

        <div className="filter-actions">
          <button onClick={handleClearFilters} className="clear-filters-btn">
            Clear Filters
          </button>
          <button onClick={handleExportData} className="export-data-btn">
            Export Data
          </button>
        </div>
      </div>

      {filteredHistory.length === 0 ? (
        <div className="no-interactions">
          <p>No chat interactions found.</p>
          {chatHistory.length > 0 && (
            <p>Try adjusting your filters or wait for users to interact with the chatbot.</p>
          )}
        </div>
      ) : (
        <div className="chat-interactions-list">
          {filteredHistory.map((item, index) => (
            <div key={index} className="chat-interaction-card">
              <div className="interaction-header">
                <div className="user-info">
                  <span className="user-avatar">👤</span>
                  <span className="user-name">{item.userName}</span>
                </div>
                <span className="interaction-time">{formatDate(item.timestamp)}</span>
              </div>
              <div className="interaction-content">
                <div className="user-message">
                  <div className="message-label">User:</div>
                  <div className="message-text">{item.userMessage}</div>
                </div>
                <div className="ai-response">
                  <div className="message-label">AI:</div>
                  <div className="message-text">{item.aiResponse}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="chat-interactions-stats">
        <div className="stat-card">
          <div className="stat-value">{filteredHistory.length}</div>
          <div className="stat-label">Interactions</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{uniqueUsers.length}</div>
          <div className="stat-label">Users</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {chatHistory.length > 0 
              ? Math.round(filteredHistory.length / uniqueUsers.length * 10) / 10 
              : 0}
          </div>
          <div className="stat-label">Avg. per User</div>
        </div>
      </div>
    </div>
  );
}