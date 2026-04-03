import 'dotenv/config';
import { createServer } from 'http';
import app from './app';
import { setupSocket } from './lib/socket';

const PORT = process.env.PORT ?? 3000;

const httpServer = createServer(app);

export const io = setupSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default httpServer;
