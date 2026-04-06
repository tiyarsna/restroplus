import { io } from 'socket.io-client'

let socket = null

export const initSocket = (token) => {
  if (socket?.connected) return socket

  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://restroplus.onrender.com'

  socket = io(SOCKET_URL, {
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 3000,
    timeout: 10000,
    transports: ['websocket', 'polling']
  })

  socket.on('connect', () => {
    console.log('🔌 Socket connected')
  })

  socket.on('disconnect', (reason) => {
    console.log('🔌 Socket disconnected:', reason)
  })

  socket.on('connect_error', (err) => {
    // Only log once, don't spam
    if (socket.io._reconnectionAttempts === 1) {
      console.warn('⚠️ Socket cannot connect to backend — is it running on port 5000?')
    }
  })

  socket.on('reconnect_failed', () => {
    console.warn('⚠️ Socket gave up reconnecting. Start backend with: npm run dev')
  })

  return socket
}

export const getSocket = () => socket

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}