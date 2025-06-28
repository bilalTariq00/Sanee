import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import config from '../config';

window.Pusher = Pusher;

export default function MessageDialog({ projectId, clientName, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const echo = useRef(null);

  useEffect(() => {
    fetchMessages();
    setupEcho();
    return () => {
      if (echo.current) {
        echo.current.leave(`chat.${projectId}`);
        echo.current.disconnect();
      }
    };
  }, [projectId]);

  const fetchMessages = async () => {
    try {
      const res = await axios.get(`${config.API_BASE_URL}/chat/messages/${projectId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setMessages(res.data.messages);
    } catch (err) {
      console.error('Fetch messages error:', err);
    }
  };

  const setupEcho = () => {
    echo.current = new Echo({
      broadcaster: 'pusher',
      key: config.PUSHER_KEY,
      cluster: 'ap2',
      forceTLS: true,
      encrypted: true,
      authEndpoint: `${config.API_BASE_URL}/broadcasting/auth`,
      auth: {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      },
    });

    echo.current.private(`chat.${projectId}`).listen('.new-message', (e) => {
      const msg = e.message;
      setMessages((prev) => [...prev, msg]);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      await axios.post(
        `${config.API_BASE_URL}/chat/send`,
        { receiver_id: projectId, message: newMessage, type: 'text' },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setNewMessage('');
    } catch (err) {
      console.error('Send message error:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="relative w-full h-full bg-white shadow-xl">
        <div className="p-4 border-b flex justify-between">
          <h3 className="text-xl font-bold">Chat with {clientName}</h3>
          <button onClick={onClose}>✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[70%] rounded-lg px-4 py-2 ${m.sender_id === parseInt(localStorage.getItem('user_id')) ? 'ml-auto bg-red-500 text-white' : 'bg-gray-100 text-gray-900'}`}
            >
              {m.message}
              <div className="text-xs text-right mt-1">
                {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="flex border-t p-4 space-x-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message"
            className="flex-1 border rounded px-3 py-2"
          />
          <button type="submit" disabled={sending} className="bg-red-500 text-white px-4 py-2 rounded">
            {sending ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}
