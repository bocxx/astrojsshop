/// <reference types="astro/client" />

type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {
    user?: {
      id: string;
      email: string;
      name: string;
      is_admin: boolean;
    };
  }
}

// Cloudflare bindings
interface Env {
  DB: D1Database;
  PHOTOS: R2Bucket;
  RESEND_API_KEY: string;
  ADMIN_EMAIL: string; // Email address to receive order notifications
}
