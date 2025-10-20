import { z } from "zod";

const envSchema = z.object({
    VITE_SERVER_URL: z.url(),
    VITE_APP_URL: z.url(),
});

const env = envSchema.parse(import.meta.env);

export default env;
