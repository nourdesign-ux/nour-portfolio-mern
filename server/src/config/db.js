import mongoose from "mongoose";
import dns from "dns";

export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is missing");
  }

  const dnsServers = process.env.DNS_SERVERS?.split(",").map(server => server.trim()).filter(Boolean);
  if (dnsServers?.length) dns.setServers(dnsServers);

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });

  console.log("MongoDB connected");
}