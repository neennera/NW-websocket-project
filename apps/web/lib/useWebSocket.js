import { useEffect, useRef, useState } from 'react';

/**
 * Custom React hook for WebSocket connections to chat rooms
 * @param {Object} config - Configuration object
 * @param {number} config.roomId - Room ID (group id)
 * @param {string} config.username - User's display name
 * @param {Function} config.onMessage - Callback when any message is received
 * @param {Function} config.onError - Callback when error occurs
 * @returns {Object} WebSocket state and controls
 */
export function useWebSocket({ roomId, username, onMessage, onError }) {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);

  // Initialize WebSocket connection
  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws';
    console.log('Connecting to WebSocket:', wsUrl);

    if (!roomId || !username) return;

    try {
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      // join websocket
      socket.addEventListener('open', () => {
        setConnected(true);
        setError(null);
        socket.send(JSON.stringify({ type: 'join', roomId, username }));
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
            if (onError) onError(data.message);
          }

          // Call custom message handler if provided
          if (onMessage) onMessage(data);
        } catch (err) {
          console.error('Failed to parse message:', err);
          setError('Failed to parse message');
        }
      });

      socket.addEventListener('error', (err) => {
        console.error('WebSocket error:', err);
        setError('WebSocket connection error');
        if (onError) onError(err);
      });

      socket.addEventListener('close', () => {
        setConnected(false);
      });
    } catch (err) {
      console.error('Failed to initialize WebSocket:', err);
      setError('Failed to initialize connection');
      if (onError) onError(err);
    }

    // Cleanup on unmount or when roomId/username changes
    return () => {
      if (wsRef.current) {
        try {
          wsRef.current.send(JSON.stringify({ type: 'leave', roomId }));
          wsRef.current.close();
        } catch (e) {
          console.error('Error closing WebSocket:', e);
        }
      }
    };
  }, [roomId, username, onMessage, onError]);

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
