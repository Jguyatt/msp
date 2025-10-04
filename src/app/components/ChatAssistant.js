import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Bot, User, Lightbulb, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';
import { processContractQuestion, getContractSuggestions } from '../../services/chatAssistantService';
import { contractService } from '../../services/supabaseService';

function ChatAssistant({ contract = null, allContracts = [] }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage = {
        id: 'welcome',
        type: 'assistant',
        content: contract 
          ? `Hi! I'm your contract assistant. I can help you with questions about your ${contract.contract_name} contract with ${contract.vendor}. What would you like to know?`
          : "Hi! I'm your contract assistant. I can help you analyze your contracts, find renewal opportunities, and answer questions about your portfolio. What would you like to know?",
        timestamp: new Date().toISOString(),
        suggestions: [
          contract ? `When should we renew our ${contract.contract_name} contract?` : 'When should we renew our contracts?',
          contract ? `What are the key terms of our ${contract.contract_name} contract?` : 'Which contracts are expiring soon?',
          contract ? `How can we optimize our ${contract.contract_name} costs?` : 'What are our highest value contracts?'
        ]
      };
      setMessages([welcomeMessage]);
    }
  }, [contract, messages.length]);

  // Handle input changes and show suggestions
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);
    
    if (value.length > 1) {
      const newSuggestions = getContractSuggestions(value, allContracts);
      setSuggestions(newSuggestions);
      setShowSuggestions(newSuggestions.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setShowSuggestions(false);
    setIsLoading(true);

    try {
      // Process the question with the chat assistant
      const response = await processContractQuestion(
        userMessage.content,
        allContracts,
        contract
      );

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.answer,
        insights: response.insights || [],
        recommendations: response.recommendations || [],
        timestamp: new Date().toISOString(),
        contractId: response.contractId
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error processing message:', error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: "I'm sorry, I encountered an error while processing your question. Please try again.",
        timestamp: new Date().toISOString(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion.text);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Render message component
  const renderMessage = (message) => {
    const isUser = message.type === 'user';
    
    return (
      <div key={message.id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
        {!isUser && (
          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <Bot className="h-4 w-4 text-blue-600" />
          </div>
        )}
        
        <div className={`max-w-[80%] ${isUser ? 'order-first' : ''}`}>
          <div className={`rounded-lg px-4 py-3 ${
            isUser 
              ? 'bg-blue-600 text-white' 
              : message.isError 
                ? 'bg-red-50 text-red-800 border border-red-200'
                : 'bg-white border border-slate-200'
          }`}>
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            
            {/* Insights */}
            {message.insights && message.insights.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-200">
                <div className="flex items-center gap-1 mb-2">
                  <Lightbulb className="h-3 w-3 text-yellow-600" />
                  <span className="text-xs font-medium text-slate-600">Key Insights</span>
                </div>
                <ul className="text-xs text-slate-600 space-y-1">
                  {message.insights.map((insight, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <span className="text-slate-400 mt-1">•</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Recommendations */}
            {message.recommendations && message.recommendations.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-200">
                <div className="flex items-center gap-1 mb-2">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-xs font-medium text-slate-600">Recommendations</span>
                </div>
                <ul className="text-xs text-slate-600 space-y-1">
                  {message.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <span className="text-green-500 mt-1">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <div className={`text-xs text-slate-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
            {new Date(message.timestamp).toLocaleTimeString()}
          </div>
        </div>
        
        {isUser && (
          <div className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-slate-600" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full max-h-[600px]">
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b border-slate-200">
        <MessageCircle className="h-5 w-5 text-blue-600" />
        <h3 className="font-semibold text-slate-900">Contract Assistant</h3>
        {contract && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
            {contract.contract_name}
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(renderMessage)}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Bot className="h-4 w-4 text-blue-600" />
            </div>
            <div className="bg-white border border-slate-200 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-sm text-slate-600">Analyzing your question...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-slate-200">
        {/* Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="mb-3 p-2 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-xs text-slate-600 mb-2">Suggestions:</div>
            <div className="space-y-1">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="block w-full text-left text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1 rounded"
                >
                  {suggestion.text}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={contract 
                ? `Ask about your ${contract.contract_name} contract...`
                : "Ask about your contracts..."
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={1}
              style={{ minHeight: '40px', maxHeight: '120px' }}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        
        <div className="text-xs text-slate-500 mt-2">
          Ask questions like "When should we renew our Azure contract?" or "Which contracts are expiring soon?"
        </div>
      </div>
    </div>
  );
}

export default ChatAssistant;
