import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: Server;

export function initSocket(server: HttpServer) {
  io = new Server(server, {
    cors: { origin: '*' }
  });
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
  });
}

export function emitToAll(event: string, data: any) {
  if (io) io.emit(event, data);
}
