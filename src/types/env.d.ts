declare module 'process' {
  global {
    namespace NodeJS {
      interface ProcessEnv {
        NODE_ENV: 'development' | 'test' | 'production';
        PORT: `${number}`;
        LOCATION_API_URL: string;
      }
    }
  }
}
