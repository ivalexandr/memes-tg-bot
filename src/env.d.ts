declare namespace NodeJS {
  interface ProcessEnv {
    BOT_TOKEN: string;
    NODE_ENV: 'development';
    OWNER_ID: string;
    DEEPSEEK_TOKEN: string;
    DEEPSEEK_URL: string;
    DEEPSEEK_MODEL: string;
    CONTEXT_TTL_HOURS: string;
    CONTEXT_MAX_TURNS: string;
  }
}
