import request from 'supertest';
import { createApp } from '../../src/app.ts';

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

export const bob = {
  name: 'Bob Iyer',
  handle: 'bob',
  email: 'bob@example.com',
  password: 'Secret123!',
};

export const link = {
  url: 'https://www.youtube.com/watch?v=aircAruvnKk',
  title: 'But what is a neural network?',
  type: 'video',
};

export const carol = {
  name: 'Carol Das',
  handle: 'carol',
  email: 'carol@example.com',
  password: 'Secret123!',
};

// Signs up and returns the agent plus the new user's id and handle.
export async function signUp(user = alice) {
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/signup').send(user).expect(201);
  return { agent, id: res.body.user.id as string, handle: user.handle };
}

export type Person = Awaited<ReturnType<typeof signUp>>;

// a sends a friend request to b, and b accepts it.
export async function makeFriends(a: Person, b: Person) {
  await a.agent.post('/api/friends/requests').send({ who: b.handle }).expect(201);
  const { body } = await b.agent.get('/api/friends').expect(200);
  const req = body.requests.find((r: { user: { id: string } }) => r.user.id === a.id);
  await b.agent.post(`/api/friends/requests/${req.id}/accept`).expect(200);
}
