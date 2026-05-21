'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

export function LiveChat({ businessId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: 'Hi there! 👋 How can I help you today?',
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    
    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: inputMessage,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);
    
    // Simulate bot response
    setTimeout(() => {
      const botResponse = generateBotResponse(inputMessage);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'bot',
        text: botResponse,
        timestamp: new Date(),
      }]);
      setIsTyping(false);
    }, 1000);
  };
  
  const generateBotResponse = (message) => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
      return 'You can find all our product prices on the product pages. Would you like me to help you find a specific product?';
    }
    if (lowerMessage.includes('shipping') || lowerMessage.includes('delivery')) {
      return 'We offer free shipping on orders over Rs. 2000! Standard delivery takes 3-5 business days, and express delivery is available for Rs. 300.';
    }
    if (lowerMessage.includes('return') || lowerMessage.includes('refund')) {
      return 'We have a 7-day return policy. Items must be unused and in original packaging. Would you like more details?';
    }
    if (lowerMessage.includes('payment') || lowerMessage.includes('pay')) {
      return 'We accept Credit/Debit cards, Cash on Delivery, JazzCash, and EasyPaisa. All payments are secure and encrypted.';
    }
    if (lowerMessage.includes('order') || lowerMessage.includes('track')) {
      return 'You can track your order by going to your account page and clicking on "My Orders". Would you like help with something else?';
    }
    if (lowerMessage.includes('hi') || lowerMessage.includes('hello') || lowerMessage.includes('hey')) {
      return 'Hello! Welcome to our store! How can I assist you today?';
    }
    if (lowerMessage.includes('thank')) {
      return 'You\'re welcome! Is there anything else I can help you with?';
    }
    if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye')) {
      return 'Goodbye! Have a great day! Feel free to come back if you need anything else.';
    }
    
    return "I'm here to help! You can ask me about:\n• Product prices\n• Shipping and delivery\n• Returns and refunds\n• Payment methods\n• Order tracking\n\nOr type 'contact' to speak with a human agent.";
  };
  
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-105"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
      </button>
    );
  }
  
  return (
    <div className={cn(
      "fixed z-50 transition-all duration-300",
      isMinimized 
        ? "bottom-6 right-6 w-auto" 
        : "bottom-6 right-6 w-96 h-[500px]"
    )}>
      {isMinimized ? (
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      ) : (
        <div className="bg-white rounded-2xl shadow-2xl border overflow-hidden flex flex-col h-full">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">Customer Support</h3>
                <p className="text-xs text-blue-100">Typically replies instantly</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMinimized(true)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.type === 'user' ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
                    message.type === 'user'
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-white border rounded-bl-none shadow-sm"
                  )}
                >
                  <p className="whitespace-pre-line">{message.text}</p>
                  <span className={cn(
                    "text-xs mt-1 block",
                    message.type === 'user' ? "text-blue-100" : "text-gray-400"
                  )}>
                    {formatTime(message.timestamp)}
                  </span>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-4 bg-white border-t">
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1"
              />
              <Button 
                type="submit" 
                size="icon"
                disabled={!inputMessage.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Powered by AI • Available 24/7
            </p>
          </form>
        </div>
      )}
    </div>
  );
}
