import { useEffect, useRef, useState } from 'react';

/**
 * Custom React hook for WebSocket connections to chat rooms
 * @param {Object} config - Configuration object
 * @param {number} config.roomId - Room ID (group id)
 * @param {string} config.username - User's display name
 * @param {number} config.userId - User's ID
 * @param {Function} config.onMessage - Callback when any message is received
 * @param {Function} config.onError - Callback when error occurs
 * @returns {Object} WebSocket state and controls
 */
export function useWebSocket({ roomId, username, userId, onMessage, onError }) {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);
  const onMessageRef = useRef(onMessage);
  const onErrorRef = useRef(onError);

  // Update refs when callbacks change
  useEffect(() => {
    onMessageRef.current = onMessage;
    onErrorRef.current = onError;
  }, [onMessage, onError]);

  // Initialize WebSocket connection
  useEffect(() => {
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    const wsUrl = backendUrl.replace('http', 'ws') + '/ws';
    console.log('Connecting to WebSocket:', wsUrl);

    if (!roomId || !username) return;

    // ป้องกัน duplicate connection
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected, skipping...');
      return;
    }

    let isMounted = true; // ตรวจสอบว่า component ยัง mount อยู่หรือไม่

    try {
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      // join websocket
      socket.addEventListener('open', () => {
        if (!isMounted) {
          socket.close();
          return;
        }
        console.log('✅ WebSocket connected');
        setConnected(true);
        setError(null);
        socket.send(JSON.stringify({ type: 'join', roomId, username, userId }));
      });

      // listen to ws event
      socket.addEventListener('message', (ev) => {
        try {
          const data = JSON.parse(ev.data);

          if (data.type === 'joined') {
            // Initial state when joining a room
            // Members come from DB (all GroupMembers), so just set them directly
            setMembers(data.members || []);
            setMessages(data.history || []);
          } else if (data.type === 'member_joined') {
            // When someone joins, request the updated member list from server
            // This ensures consistency across all browsers and avoids duplicates
            console.log(`Member joined, requesting updated member list`);
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({ type: 'list', roomId }));
            }
          } else if (data.type === 'member_left') {
            // When someone leaves, request the updated member list from server
            console.log(`Member left, requesting updated member list`);
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({ type: 'list', roomId }));
            }
          } else if (data.type === 'list') {
            // Response from server with updated member list
            console.log(`Received updated member list:`, data.members);
            setMembers(data.members || []);
            if (data.history) {
              setMessages(data.history);
            }
          } else if (data.type === 'message') {
            // Add new message
            setMessages((m) => [...m, data.message]);
          } else if (data.type === 'error') {
            console.error('WebSocket error:', data.message);
            setError(data.message);
            if (onErrorRef.current) onErrorRef.current(data.message);
          }

          // Call custom message handler if provided
          if (onMessageRef.current) onMessageRef.current(data);
        } catch (err) {
          console.error('Failed to parse message:', err);
          setError('Failed to parse message');
        }
      });

      socket.addEventListener('error', (err) => {
        console.error('WebSocket error:', err);
        setError('WebSocket connection error');
        if (onErrorRef.current) onErrorRef.current(err);
      });

      socket.addEventListener('close', () => {
        setConnected(false);
      });
    } catch (err) {
      console.error('Failed to initialize WebSocket:', err);
      setError('Failed to initialize connection');
      if (onErrorRef.current) onErrorRef.current(err);
    }

    // Cleanup on unmount or when roomId/username changes
    return () => {
      isMounted = false;
      if (wsRef.current) {
        console.log('🔌 Disconnecting WebSocket...');
        try {
          if (wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'leave', roomId }));
          }
          wsRef.current.close();
          wsRef.current = null;
        } catch (e) {
          console.error('Error closing WebSocket:', e);
        }
      }
    };
  }, [roomId, username, userId]); // ลบ onMessage, onError ออกจาก dependencies

  // Send a text message to the room
  const sendMessage = (text) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setError('Not connected to WebSocket');
      return false;
    }
    if (!text.trim()) {
      return false;
    }
    try {
      wsRef.current.send(
        JSON.stringify({ type: 'message', roomId, text, sender: username })
      );
      return true;
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message');
      return false;
    }
  };

  // Request list of members and messages (useful for refreshing)
  const requestRoomList = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setError('Not connected to WebSocket');
      return;
    }
    try {
      wsRef.current.send(JSON.stringify({ type: 'list', roomId }));
    } catch (err) {
      console.error('Failed to request room list:', err);
      setError('Failed to request room list');
    }
  };

  // Manually leave the room and close connection
  const disconnect = () => {
    if (wsRef.current) {
      try {
        wsRef.current.send(JSON.stringify({ type: 'leave', roomId }));
        wsRef.current.close();
      } catch (e) {
        console.error('Error disconnecting:', e);
      }
    }
  };

  return {
    connected,
    messages,
    members,
    error,
    sendMessage,
    requestRoomList,
    disconnect,
  };
}
