import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRouter from './routes/auth.routes';
import tutorsRouter from './routes/tutors.routes';
import connectionsRouter from './routes/connections.routes';
import messagesRouter from './routes/messages.routes';
import paymentRequestsRouter from './routes/payment-requests.routes';
import paymentsRouter from './routes/payments.routes';
import webhooksRouter from './routes/webhooks.routes';
import reviewsRouter from './routes/reviews.routes';
import adminRouter from './routes/admin.routes';
import customersRouter from './routes/customers.routes';

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Routers
app.use('/api/auth', authRouter);
app.use('/api/tutors', tutorsRouter);
app.use('/api/connections', connectionsRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/payment-requests', paymentRequestsRouter);
app.use('/api/payments', paymentsRouter);
// Webhooks router uses express.raw() internally for the stripe route
app.use('/api/webhooks', webhooksRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/customers', customersRouter);

export default app;
