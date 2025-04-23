if (!process.env.NEXT_PUBLIC_BACKEND_URL || !process.env.NEXT_PUBLIC_CLOUDFRONT_URL) {
    throw new Error("Missing environment variables");
  }
  
  export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  export const CLOUDFRONT_URL = process.env.NEXT_PUBLIC_CLOUDFRONT_URL;
  