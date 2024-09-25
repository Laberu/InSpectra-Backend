require("dotenv").config();
const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const authRouter = require('../routes/auth'); // Adjust path as needed
const User = require('../models/user');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { hash } = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use('/auth', authRouter);

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Auth Routes', () => {

  describe('POST /auth/signup', () => {
    it('should create a new user and return success message', async () => {
      const response = await request(app).post('/auth/signup').send({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(response.statusCode).toBe(200);
      expect(response.body.message).toBe('User created successfully! 🥳');
    });

    it('should return error if user already exists', async () => {
      // Create user first
      await request(app).post('/auth/signup').send({
        email: 'existing@example.com',
        password: 'password123'
      });

      // Attempt to create the same user
      const response = await request(app).post('/auth/signup').send({
        email: 'existing@example.com',
        password: 'password123'
      });

      expect(response.statusCode).toBe(500);
      expect(response.body.message).toBe("User already exists! Try logging in. 😄");
    });
  });

  describe('POST /auth/signin', () => {
    it('should sign in the user and return tokens', async () => {
      const passwordHash = await hash('password123', 10);
      await User.create({ email: 'signin@example.com', password: passwordHash });

      const response = await request(app).post('/auth/signin').send({
        email: 'signin@example.com',
        password: 'password123'
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.body).toHaveProperty('accesstoken');
    });

    it('should return error if user does not exist', async () => {
      const response = await request(app).post('/auth/signin').send({
        email: 'nonexistent@example.com',
        password: 'password123'
      });

      expect(response.statusCode).toBe(500);
      expect(response.body.message).toBe("User doesn't exist! 😢");
    });

    it('should return error if password is incorrect', async () => {
      const passwordHash = await hash('password123', 10);
      await User.create({ email: 'signin-error@example.com', password: passwordHash });

      const response = await request(app).post('/auth/signin').send({
        email: 'signin-error@example.com',
        password: 'wrongpassword'
      });

      expect(response.statusCode).toBe(500);
      expect(response.body.message).toBe("Password is incorrect! ⚠️");
    });
  });

  describe('POST /auth/logout', () => {
    it('should clear the refresh token cookie', async () => {
      const response = await request(app).post('/auth/logout');

      expect(response.statusCode).toBe(200);
      expect(response.body.message).toBe("Logged out successfully! 🤗");
      expect(response.headers['set-cookie']).toBeDefined();
    });
  });

  describe('POST /auth', () => {
    it('should refresh the token if refresh token is valid', async () => {
      const passwordHash = await hash('password123', 10);
      const user = await User.create({ email: 'refresh@example.com', password: passwordHash });
      
      const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
      await User.findByIdAndUpdate(user._id, { refreshtoken: refreshToken });

      const response = await request(app).post('/auth').set('Cookie', `refreshtoken=${refreshToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.message).toBe("Refreshed successfully! 🤗");
      expect(response.body).toHaveProperty('accessToken');
    });

    it('should return error if refresh token is invalid', async () => {
      const response = await request(app).post('/auth').set('Cookie', 'refreshtoken=invalidtoken');

      expect(response.statusCode).toBe(500);
      expect(response.body.message).toBe("Invalid refresh token! 🤔");
    });
  });

  describe('GET /auth/protected', () => {
    it('should return success message if user is authenticated', async () => {
      // Hash password and create user
      const passwordHash = await hash('password123', 10);
      const user = await User.create({ email: 'protected@example.com', password: passwordHash });
      
      // Generate refresh token and update user in DB
      const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
      await User.findByIdAndUpdate(user._id, { refreshtoken: refreshToken });

      // Sign in to get access token
      const signinResponse = await request(app)
        .post('/auth/signin')
        .send({
          email: 'protected@example.com',
          password: 'password123'
        });

      // Ensure access token is received (fix case issue if necessary)
      const accessToken = signinResponse.body.accessToken || signinResponse.body.accesstoken;
      expect(accessToken).toBeDefined(); // Add this check to ensure the token is returned

      // Send request to protected route using the access token in Authorization header
      const response = await request(app)
        .get('/auth/protected')
        .set('Authorization', `Bearer ${accessToken}`);  // Set access token in Authorization header

      // Validate response
      expect(response.statusCode).toBe(200);
      expect(response.body.message).toBe("You are logged in! 🤗");
    });
  });


  describe('POST /auth/send-password-reset-email', () => {
    it('should send password reset email', async () => {
      await User.create({ email: 'reset@example.com', password: 'password123' });

      const response = await request(app).post('/auth/send-password-reset-email').send({
        email: 'reset@example.com'
      });

    //   expect(response.statusCode).toBe(200);
      expect(response.body.message).toBe("Password reset link has been sent to your email! 📧");
    });

    it('should return error if user does not exist', async () => {
      const response = await request(app).post('/auth/send-password-reset-email').send({
        email: 'nonexistent@example.com'
      });

      expect(response.statusCode).toBe(500);
      expect(response.body.message).toBe("User doesn't exist! 😢");
    });
  });

  describe('POST /auth/reset-password/:id/:token', () => {
    it('should reset the password if token is valid', async () => {
      const passwordHash = await hash('password123', 10);
      const user = await User.create({ email: 'reset-password@example.com', password: passwordHash });
      
      const resetToken = jwt.sign({ id: user._id }, user.password, { expiresIn: '1h' });
      const response = await request(app).post(`/auth/reset-password/${user._id}/${resetToken}`).send({
        newPassword: 'newpassword123'
      });

    //   expect(response.statusCode).toBe(200);
      expect(response.body.message).toBe("Email sent! 📧");
    });

    it('should return error if token is invalid', async () => {
      const passwordHash = await hash('password123', 10);
      const user = await User.create({ email: 'invalid-token@example.com', password: passwordHash });
      
      const response = await request(app).post(`/auth/reset-password/${user._id}/invalidtoken`).send({
        newPassword: 'newpassword123'
      });

      expect(response.statusCode).toBe(500);
      expect(response.body.message).toBe("Invalid token! 😢");
    });
  });

});
