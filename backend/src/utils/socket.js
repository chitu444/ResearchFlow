import { Server } from 'socket.io';

let io;

export function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    },
  });

  io.on('connection', (socket) => {
    socket.on('join-experiment', (id) => socket.join(`experiment:${id}`));
    socket.on('leave-experiment', (id) => socket.leave(`experiment:${id}`));
  });

  return io;
}

export function emitEvent(event, payload, room = null) {
  if (!io) return;
  if (room) {
    io.to(room).emit(event, payload);
  } else {
    io.emit(event, payload);
  }
}
