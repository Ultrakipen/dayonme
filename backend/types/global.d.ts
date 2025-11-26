// types/global.d.ts
import { Server } from 'socket.io';

declare global {
  var io: Server;
  namespace NodeJS {
    interface Global {
      io: Server;
    }
  }
}

export { };

