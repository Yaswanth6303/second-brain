import request from 'supertest';
import { createApp } from '../app.ts';

export const app = createApp();

export const alice = {
  name: 'Alice Rao',
  handle: 'alice',
  email: 'alice@example.com',
  password: 'Secret123!',
};

// Signs up and returns an agent that keeps the auth cookie.
export async function signedInAgent(user = alice) {
  const agent = request.agent(app);
  await agent.post('/api/auth/signup').send(user).expect(201);
  return agent;
}
