import mongoose from "mongoose";
import dns from "dns";

mongoose.set("bufferCommands", false);

export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is missing");
  }

  const dnsServers = process.env.DNS_SERVERS?.split(",").map(server => server.trim()).filter(Boolean);
  if (dnsServers?.length) dns.setServers(dnsServers);

  const options = { serverSelectionTimeoutMS: 8000, connectTimeoutMS: 8000 };
  try {
    await mongoose.connect(uri, options);
  } catch (error) {
    const hosts = process.env.MONGODB_FALLBACK_HOSTS;
    if (!hosts || !uri.startsWith("mongodb+srv://") || !["ETIMEOUT", "ESERVFAIL", "ECONNREFUSED"].includes(error?.code)) throw error;
    const parsed = new URL(uri);
    const database = parsed.pathname || "/admin";
    const params = new URLSearchParams(parsed.search);
    const fallbackParams = new URLSearchParams(process.env.MONGODB_FALLBACK_OPTIONS || "authSource=admin&tls=true");
    fallbackParams.forEach((value, key) => params.set(key, value));
    const fallbackUri = `mongodb://${parsed.username}:${parsed.password}@${hosts}${database}?${params.toString()}`;
    await mongoose.connect(fallbackUri, options);
  }

  console.log("MongoDB connected");
}
