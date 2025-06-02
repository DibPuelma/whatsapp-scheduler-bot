import { createTRPCRouter } from "./trpc";
import { whatsappRouter } from "./routers/whatsapp";

export const appRouter = createTRPCRouter({
  whatsapp: whatsappRouter,
});

export type AppRouter = typeof appRouter; 