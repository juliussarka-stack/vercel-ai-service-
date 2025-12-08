# Vercel AI Service

Streaming AI offer generation service for GESA Company.

## Structure

- `/api` - Serverless functions
- `/lib` - Shared utilities and types

## Deployment

This service is deployed on Vercel and handles AI-powered offer generation with Server-Sent Events (SSE) streaming.

## Environment Variables

Required:
- `OPENAI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
