//Zod validation for environment variables, this is where frontend env object is exported from
import { z } from "zod";

const envSchema = z.object({
    VITE_SERVER_URL: z.url(),
    VITE_APP_URL: z.url(),
});

const env = envSchema.parse(import.meta.env);

export default env;
