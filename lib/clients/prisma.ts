import { PrismaClient } from "@prisma/client";

declare global {
  // Allow global `var` for Prisma client.
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const client = globalThis.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalThis.prisma = client;

export default client;
