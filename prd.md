
# 🧠 Pragyan AI Twin – MVP Memory System

## 📌 Overview

The goal is to build a **web-based AI twin** that talks like *you* (Pragyan), remembers facts, diary entries, and preferences, and interacts with users like a real human — including asking them questions back and storing what it learns.

This MVP will focus on:
- Logging personal facts & diary entries
- Embedding and storing them in a vector-aware database
- Semantic retrieval and injection into GPT conversations
- Early personalization features (e.g., asking users what they like)

## 🎯 Objective

- Enable a conversational AI agent that can recall and respond using your real experiences and preferences.
- Make it feel human by answering naturally and asking users questions back.
- Store user inputs as memory too, with scope for personalization later.

## 🧩 Key Features (MVP)

### 1. 📝 Diary & Fact Logging (Admin-Only)
- Web UI for you to enter:
  - Diary entries
  - Personal facts
  - Preferences
- Optional metadata: mood, visibility, tags

### 2. 🧠 Embedding + Vector Storage
- Text entries are embedded using `text-embedding-3-small` (OpenAI)
- Stored in PostgreSQL using `pgvector`

### 3. 🔍 Memory Retrieval (RAG-style)
- When user asks something:
  - Generate embedding of query
  - Retrieve top-N relevant memories using vector similarity
  - Inject memories into GPT prompt for better context

### 4. 💬 Conversational Agent
- Answers in your voice
- If the question is personal (e.g. “What food do you like?”), it also asks back: “What about you?”
- Can store user answers as new memories (type = user_input)

### 5. 🗃️ User Memory Store
- Optionally stores user preferences for personalization
- Example:
  - user_id: `anon_1`
  - type: `preference`
  - content: `"I like Lo-Fi and K-pop"`
  - tags: `['music']`

## 🔐 Visibility Levels

- `public` – anyone can access
- `close_friends` – restricted; agent replies with “that’s private” if not trusted
- `private` – agent won’t reveal at all

## 🛠️ Architecture

### Backend
- **PostgreSQL + pgvector**
  - Table: `memories`
- **Embedding API**: OpenAI
- **App Server**: Node.js / Next.js API routes

### GPT Prompting Flow
```
[User Message]
   ↓
Embed → Vector Search → Top-N Memories
   ↓
[Inject Memories + Message into GPT prompt]
   ↓
[LLM Response]
```

## 🧱 DB Schema: `memories`

| Field        | Type          | Description |
|--------------|---------------|-------------|
| `id`         | UUID          | Primary key |
| `content`    | TEXT          | Raw memory |
| `embedding`  | VECTOR(1536)  | OpenAI embedding |
| `type`       | TEXT          | 'fact', 'diary', 'preference', 'user_input', 'system' |
| `subject`    | TEXT          | 'self' or 'user' |
| `user_id`    | TEXT          | For user memories |
| `tags`       | TEXT[]        | Music, mood, topic |
| `visibility` | TEXT          | 'public', 'close_friends', 'private' |
| `mood`       | TEXT          | Optional emotional tone |
| `metadata`   | JSONB         | Any extra info |
| `created_at` | TIMESTAMP     | Auto timestamp |

## 🧪 Sample Flows

### ✍️ Logging a Diary Entry
1. User logs: "Today I listened to metal and built my twin agent"
2. Embedding generated
3. Stored as:
   - type: `diary`
   - tags: `['music', 'project']`
   - mood: `excited`

### 💬 User Interaction
1. User: "What music do you like?"
2. Agent:
   - Searches vector DB → finds memory
   - Answers: "Lately I’ve been into brutal slam and synthwave."
   - Asks: "What kind of music are you into?"

3. User: "Mostly Lo-Fi"
4. Agent stores:
   - subject: `user`
   - content: `"Mostly Lo-Fi"`
   - type: `user_input`
   - tags: `['music']`

## 🧪 Optional Future Features (V2+)

| Feature             | Description                                      |
|---------------------|--------------------------------------------------|
| Graph DB            | For friend/entity relationships, event chains    |
| Real-time Spotify   | Auto-create memories from music activity         |
| Face recognition    | Gate private facts by trust level                |
| Admin UI            | Curate/delete/update memories                    |
| Sentiment analysis  | Auto-detect mood on diary submission             |

## 📅 Timeline (Suggested)

| Week | Task                                           |
|------|------------------------------------------------|
| 1    | Setup Postgres + pgvector, create schema       |
| 2    | Embedding + insert pipeline                    |
| 3    | Basic frontend (diary input + memory viewer)   |
| 4    | Vector search + GPT integration                |
| 5    | User Q&A flow + Ask-back logic                 |
| 6    | Memory injection + trust level logic           |

## ✅ Deliverables

- PostgreSQL DB with schema + vector search
- OpenAI embedding pipeline
- Next.js frontend (basic input + chat)
- LLM memory injection layer
- Stored user preferences
- Conversation logging + memory updates

## 💥 Success Criteria

- Agent recalls relevant facts naturally
- Agent *asks back* and stores user replies
- Stored memory visible and queryable
- Chat feels personalized and human-like
