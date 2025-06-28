import React, { useState } from 'react';
import { Send, Paperclip } from 'lucide-react';

export default function ChatBot() {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-3xl mx-auto">
      {/* ... rest of the component content ... */}
    </div>
  );
}