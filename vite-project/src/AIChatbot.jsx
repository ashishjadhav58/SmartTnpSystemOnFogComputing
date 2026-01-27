import React, { useState, useEffect, useRef } from 'react';
import './style.css';

export default function AIChatbot({ userRole = 'Student' }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const backendUrl = localStorage.getItem('fogIp') || 'http://localhost:5000';

  useEffect(() => {
    // Add welcome message
    setMessages([{
      role: 'assistant',
      content: getWelcomeMessage(userRole)
    }]);
  }, [userRole]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getWelcomeMessage = (role) => {
    const messages = {
      'Student': 'Hello! I\'m your AI assistant. I can help you with:\n- Placement drive information\n- Resume building tips\n- Eligibility checks\n- Career guidance\n\nHow can I help you today?',
      'Recruiter': 'Hello! I\'m your AI assistant. I can help you with:\n- Finding suitable students\n- Drive management\n- Filtering and analytics\n\nHow can I help you today?',
      'Training and placement officer': 'Hello! I\'m your AI assistant. I can help you with:\n- System statistics\n- Student management\n- Drive approvals\n- Analytics\n\nHow can I help you today?',
      'Class Teacher': 'Hello! I\'m your AI assistant. I can help you with:\n- Student information\n- Attendance tracking\n- Performance metrics\n\nHow can I help you today?'
    };
    return messages[role] || messages['Student'];
  };

  const getContextualPrompt = (userRole, userMessage) => {
    const basePrompts = {
      'Student': `You are an AI assistant for a Training & Placement system. The user is a student. Help them with:
- Placement drive eligibility and requirements
- Resume building and improvement
- Career guidance
- Skill recommendations
Be helpful, concise, and encouraging.`,
      'Recruiter': `You are an AI assistant for a Training & Placement system. The user is a recruiter. Help them with:
- Finding students matching their requirements
- Understanding AI fit scores
- Drive creation guidelines
- Student filtering strategies
Be professional and informative.`,
      'Training and placement officer': `You are an AI assistant for a Training & Placement system. The user is a TPO. Help them with:
- System statistics and analytics
- Student performance metrics
- Drive approval guidelines
- Recruiter management
Be professional and data-focused.`,
      'Class Teacher': `You are an AI assistant for a Training & Placement system. The user is a class teacher. Help them with:
- Student information and profiles
- Attendance tracking
- Performance monitoring
- Communication with students
Be helpful and informative.`
    };

    return basePrompts[userRole] || basePrompts['Student'];
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setLoading(true);

    try {
      // Call backend AI chat endpoint with LLaMA (Groq)
      const response = await axios.post(`${backendUrl}/api/ai/chat`, {
        message: currentInput,
        userRole: userRole,
        history: messages.slice(-10) // Send last 10 messages for context
      }, {
        timeout: 30000  // LLM calls may take longer
      });
      
      const aiResponse = response.data.response || response.data.error || 'Sorry, I could not generate a response.';
      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
    } catch (err) {
      console.error('Error getting AI response:', err);
      const errorMessage = err.response?.data?.response || 
                          err.response?.data?.error || 
                          'Sorry, I encountered an error. Please try again.';
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: errorMessage
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
            fontSize: '24px',
            zIndex: 1000
          }}
        >
          💬
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '350px',
            height: '500px',
            backgroundColor: 'white',
            borderRadius: '10px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '15px',
              backgroundColor: '#007bff',
              color: 'white',
              borderRadius: '10px 10px 0 0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <h6 style={{ margin: 0 }}>AI Assistant</h6>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '20px',
                cursor: 'pointer'
              }}
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '15px',
              backgroundColor: '#f8f9fa'
            }}
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  marginBottom: '10px',
                  textAlign: msg.role === 'user' ? 'right' : 'left'
                }}
              >
                <div
                  style={{
                    display: 'inline-block',
                    padding: '10px 15px',
                    borderRadius: '10px',
                    backgroundColor: msg.role === 'user' ? '#007bff' : '#e9ecef',
                    color: msg.role === 'user' ? 'white' : 'black',
                    maxWidth: '80%',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ textAlign: 'left', marginBottom: '10px' }}>
                <div
                  style={{
                    display: 'inline-block',
                    padding: '10px 15px',
                    borderRadius: '10px',
                    backgroundColor: '#e9ecef'
                  }}
                >
                  Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '15px', borderTop: '1px solid #ddd', display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your message..."
              style={{
                flex: 1,
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '5px'
              }}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              style={{
                padding: '8px 15px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
