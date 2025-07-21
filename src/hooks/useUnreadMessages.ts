// src/hooks/useUnreadMessages.ts
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import config from '@/config';

export function useUnreadMessages(pollInterval = 30000) {
  const [unread, setUnread] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  const fetchUnread = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${config.API_BASE_URL}/chat/unread-messages`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const map: Record<string, boolean> = {};
      (res.data.messages || []).forEach((msg: any) => {
        if (msg.sender?.uid) map[msg.sender.uid] = true;
      });
      setUnread(map);
    } catch (err) {
      console.error('Failed to fetch unread messages', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnread();
    const id = setInterval(fetchUnread, pollInterval);
    return () => clearInterval(id);
  }, [fetchUnread, pollInterval]);

  // number of distinct senders with unread messages
  const count = Object.keys(unread).length;

  // mark all from a particular uid as read
  const markRead = (uid: string) => {
    setUnread((prev) => {
      const next = { ...prev };
      delete next[uid];
      return next;
    });
  };

  return { unread, count, loading, markRead };
}
