// app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/auth" // Mengimpor handlers dari file auth.ts Anda
export const { GET, POST } = handlers