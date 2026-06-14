import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

app.use(cors());
app.use(express.json());

// --- AUTH MIDDLEWARE ---
const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// --- ROUTES ---

// 1. Auth Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  // Logic for Admin or Client Login
  // This is where you'd check bcrypt hashes
  const client = await prisma.client.findFirst({
    where: { email, password, isArchived: false },
    include: { users: true }
  });

  if (client || (email === 'admin@platform.com' && password === 'admin')) {
    const userPayload = client 
      ? { id: client.id, role: 'CLIENT', name: client.companyName }
      : { id: 'admin', role: 'ADMIN', name: 'Super Admin' };
      
    const token = jwt.sign(userPayload, JWT_SECRET);
    res.json({ token, user: userPayload });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// 2. Products API
app.get('/api/products', async (req, res) => {
  const products = await prisma.product.findMany({
    include: { category: true }
  });
  res.json(products);
});

app.post('/api/products', authenticate, async (req, res) => {
  const product = await prisma.product.create({ data: req.body });
  res.json(product);
});

// 3. Clients API
app.get('/api/clients', authenticate, async (req, res) => {
  const clients = await prisma.client.findMany({
    where: { isArchived: false },
    include: { users: true }
  });
  res.json(clients);
});

app.post('/api/clients', authenticate, async (req, res) => {
  const client = await prisma.client.create({ 
    data: { ...req.body, outstandingBalance: 0 }
  });
  res.json(client);
});

// 4. Orders API
app.get('/api/orders', authenticate, async (req, res) => {
  const orders = await prisma.order.findMany({
    include: { items: true, paymentLogs: true, auditLogs: true }
  });
  res.json(orders);
});

app.post('/api/orders', authenticate, async (req, res) => {
  const { items, ...orderData } = req.body;
  const order = await prisma.order.create({
    data: {
      ...orderData,
      items: { create: items },
      auditLogs: {
        create: {
          userId: req.user.id,
          action: 'ORDER_PLACED',
          details: 'New order created via API'
        }
      }
    }
  });
  
  // Update client balance
  await prisma.client.update({
    where: { id: orderData.clientId },
    data: { outstandingBalance: { increment: orderData.totalAmount } }
  });
  
  res.json(order);
});

// 5. Payment Settlement
app.post('/api/orders/:id/settle', authenticate, async (req, res) => {
  const { amount, mode, refNumber, notes } = req.body;
  const orderId = req.params.id;

  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: 'PAID',
      paymentLogs: {
        create: { amount, mode, refNumber, notes }
      }
    }
  });

  await prisma.client.update({
    where: { id: order.clientId },
    data: { outstandingBalance: { decrement: amount } }
  });

  res.json(order);
});

app.listen(PORT, () => console.log(`Backend ready on port ${PORT}`));
