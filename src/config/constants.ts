export const CONFIG = {
    PORT: process.env.PORT || 3000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    OPENAI_MODEL: 'gpt-4',
    EMBEDDING_MODEL: 'text-embedding-ada-002',
    VECTOR_DIMENSION: 1536,
    MAX_PRODUCTS_PER_RESPONSE: 5,
    SIMILARITY_THRESHOLD: 0.7
  };