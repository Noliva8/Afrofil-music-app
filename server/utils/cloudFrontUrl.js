// // signing-utils.js - USING AWS SDK
// import { getSignedUrl as awsGetSignedUrl } from '@aws-sdk/cloudfront-signer';
// import fs from 'fs';
// import path from 'path';




// export function getSignedUrlCf (filePath, expiresInSeconds = 18000) {
//   console.log('[CloudFront] 🚀 Generating signed URL with AWS SDK');
//   console.log('[CloudFront] Input filePath:', filePath);
  
//   // Get environment variables
//   const keypairId = process.env.CLOUDFRONT_PUBLIC_KEY_ID;
//   const privateKeyPath = process.env.CLOUDFRONT_PRIVATE_KEY_PATH;
//   const domain = process.env.CLOUDFRONT_DOMAIN || 'd1is1eedem5lyc.cloudfront.net';
  
//   if (!keypairId || !privateKeyPath) {
//     throw new Error('Missing CloudFront credentials');
//   }
  
//   // Read private key
//   const resolvedPath = path.isAbsolute(privateKeyPath) 
//     ? privateKeyPath 
//     : path.resolve(process.cwd(), privateKeyPath);
  
//   if (!fs.existsSync(resolvedPath)) {
//     throw new Error(`Private key file not found: ${resolvedPath}`);
//   }
  
//   const privateKey = fs.readFileSync(resolvedPath, 'utf8')
//     .replace(/\\n/g, '\n')
//     .trim();
  
//   // ✅ CRITICAL FIX: Properly encode the path
//   const prepareUrlForSigning = (path) => {
//     // Ensure it starts with /
//     const cleanPath = path.startsWith('/') ? path : `/${path}`;
    
//     // First decode any existing encoding
//     let decodedPath;
//     try {
//       decodedPath = decodeURIComponent(cleanPath);
//     } catch (e) {
//       decodedPath = cleanPath;
//     }
    
//     // Now properly encode everything
//     let encodedPath = encodeURI(decodedPath);

//     // Manually encode characters encodeURI leaves alone but CloudFront may canonicalize differently.
//     // This keeps signature generation aligned with how CloudFront parses the URL.
//     encodedPath = encodedPath
//       .replace(/\(/g, '%28')
//       .replace(/\)/g, '%29')
//       .replace(/'/g, '%27')
//       .replace(/!/g, '%21')
//       .replace(/\*/g, '%2A');
    
//     // Special: & must be %26 for CloudFront
//     const finalPath = encodedPath.replace(/&/g, '%26');
    
//     console.log('[CloudFront] Path encoding:', {
//       input: cleanPath,
//       decoded: decodedPath,
//       encoded: encodedPath,
//       final: finalPath
//     });
    
//     return finalPath;
//   };
  
//   const preparedPath = prepareUrlForSigning(filePath);
//   const urlToSign = `https://${domain}${preparedPath}`;
  
//   console.log('[CloudFront] URL to sign:', urlToSign);
  
//   // Verify & is properly encoded
//   if (urlToSign.includes('&') && !urlToSign.includes('%26')) {
//     console.error('[CloudFront] ❌ ERROR: URL contains unencoded &');
//     console.error('  This will fail! URL:', urlToSign);
    
//     // Auto-fix it
//     const fixedUrl = urlToSign.replace(/&/g, '%26');
//     console.error('[CloudFront]   Fixed URL:', fixedUrl);
    
//     // Use the fixed URL
//     return awsGetSignedUrl({
//       url: fixedUrl,
//       keyPairId: keypairId,
//       dateLessThan: new Date(Date.now() + (expiresInSeconds * 1000)),
//       privateKey: privateKey,
//     });
//   }
  
//   try {
//     const signedUrl = awsGetSignedUrl({
//       url: urlToSign,
//       keyPairId: keypairId,
//       dateLessThan: new Date(Date.now() + (expiresInSeconds * 1000)),
//       privateKey: privateKey,
//     });
    
//     console.log('[CloudFront] ✅ Signed URL generated');
    
//     // Final validation
//     const urlObj = new URL(signedUrl);
//     const pathname = urlObj.pathname;
    
//     if (pathname.includes('&') && !pathname.includes('%26')) {
//       console.error('[CloudFront] ❌ FINAL WARNING: Signed URL path contains &');
//       console.error('  Path:', pathname);
//     }
    
//     return signedUrl;
//   } catch (error) {
//     console.error('[CloudFront] ❌ AWS SDK signing failed:', error.message);
//     throw error;
//   }
// }


import fs from "node:fs";
import path from "node:path";
import { getSignedUrl } from "@aws-sdk/cloudfront-signer";
import { CLOUDFRONT_EXPIRATION } from "../schemas/Artist_schema/Redis/keys.js";



export const getPresignedUrlDownloadAudio = (_, { bucket, key, region }) => {

  const cloudfrontDistributionDomain = process.env.CLOUDFRONT_DOMAIN;
 

  if (!cloudfrontDistributionDomain) {
    throw new Error("Missing CLOUDFRONT_DOMAIN env var");
  }

  const s3ObjectKey = key.startsWith("/") ? key.substring(1) : key;
  

  // Build URL

  const url = `https://${cloudfrontDistributionDomain}/${s3ObjectKey}`;



  // ✅ Proper path encoding
  const urlObj = new URL(url);
  const decodedPathname = (() => {
    try {
      return decodeURIComponent(urlObj.pathname);
    } catch {
      return urlObj.pathname;
    }
  })();

  const encodedPathname = decodedPathname
    .split("/")
    .map((seg, idx) => (idx === 0 ? "" : encodeURIComponent(seg)))
    .join("/");

  urlObj.pathname = encodedPathname;
  const encodedUrl = urlObj.toString();
 

  const privateKeyPath = process.env.CLOUDFRONT_PRIVATE_KEY_PATH;
  const keyPairId = process.env.CLOUDFRONT_PUBLIC_KEY_ID;
  
  // ✅ Ensure expiration is a number
  const expirationMs = Number(CLOUDFRONT_EXPIRATION) * 1000;
  const dateLessThan = new Date(Date.now() + expirationMs);



  if (!privateKeyPath) throw new Error("Missing CLOUDFRONT_PRIVATE_KEY_PATH");
  if (!keyPairId) throw new Error("Missing CLOUDFRONT_PUBLIC_KEY_ID");

 

  try {
    // ✅ Read private key
    const resolvedKeyPath = path.isAbsolute(privateKeyPath)
      ? privateKeyPath
      : path.resolve(process.cwd(), privateKeyPath);

    if (!fs.existsSync(resolvedKeyPath)) {
      throw new Error(`Private key file not found: ${resolvedKeyPath}`);
    }

    const privateKeyContent = fs
      .readFileSync(resolvedKeyPath, "utf8")
      .replace(/\\n/g, "\n")
      .trim();

  

    const signedUrl = getSignedUrl({
      url: encodedUrl,
      keyPairId,
      dateLessThan,
      privateKey: privateKeyContent,
    });

  

    // ✅ Return original format (Date object)
    return {
      url: signedUrl,
      expiration: dateLessThan, // Keep as Date object for compatibility
    };
  } catch (error) {
    console.error("❌ ERROR in getSignedUrl:", error);
    console.error("Error message:", error.message);
    
    // More specific error handling
    if (error.message.includes("unsupported") || error.message.includes("DECODER")) {
      console.error("🔑 Key format issue detected!");
      console.error("Make sure private key is in correct PEM format");
    }
    
    console.error("Error stack:", error.stack);
    
    throw error;
  }
};





export const getPresignedUrlDownload = (_, { bucket, key, region }) => {
  

  const cloudfrontDistributionDomain = process.env.CLOUDFRONT_DOMAIN;
 

  if (!cloudfrontDistributionDomain) {
    throw new Error("Missing CLOUDFRONT_DOMAIN env var");
  }

  const s3ObjectKey = key.startsWith("/") ? key.substring(1) : key;
  

  // Build URL
 
const url = `https://${cloudfrontDistributionDomain}/${s3ObjectKey}`;


  // ✅ Proper path encoding
  const urlObj = new URL(url);
  const decodedPathname = (() => {
    try {
      return decodeURIComponent(urlObj.pathname);
    } catch {
      return urlObj.pathname;
    }
  })();

  const encodedPathname = decodedPathname
    .split("/")
    .map((seg, idx) => (idx === 0 ? "" : encodeURIComponent(seg)))
    .join("/");

  urlObj.pathname = encodedPathname;
  const encodedUrl = urlObj.toString();


  const privateKeyPath = process.env.CLOUDFRONT_PRIVATE_KEY_PATH;
  const keyPairId = process.env.CLOUDFRONT_PUBLIC_KEY_ID;
  
  // ✅ Ensure expiration is a number
  const expirationMs = Number(CLOUDFRONT_EXPIRATION) * 1000;
  const dateLessThan = new Date(Date.now() + expirationMs);



  if (!privateKeyPath) throw new Error("Missing CLOUDFRONT_PRIVATE_KEY_PATH");
  if (!keyPairId) throw new Error("Missing CLOUDFRONT_PUBLIC_KEY_ID");



  try {
    // ✅ Read private key
    const resolvedKeyPath = path.isAbsolute(privateKeyPath)
      ? privateKeyPath
      : path.resolve(process.cwd(), privateKeyPath);

    if (!fs.existsSync(resolvedKeyPath)) {
      throw new Error(`Private key file not found: ${resolvedKeyPath}`);
    }

    const privateKeyContent = fs
      .readFileSync(resolvedKeyPath, "utf8")
      .replace(/\\n/g, "\n")
      .trim();

  

    const signedUrl = getSignedUrl({
      url: encodedUrl,
      keyPairId,
      dateLessThan,
      privateKey: privateKeyContent,
    });

 


    // ✅ Return original format (Date object)
    return {
      url: signedUrl,
      expiration: dateLessThan, // Keep as Date object for compatibility
    };
  } catch (error) {
    console.error("❌ ERROR in getSignedUrl:", error);
    console.error("Error message:", error.message);
    
    // More specific error handling
    if (error.message.includes("unsupported") || error.message.includes("DECODER")) {
      console.error("🔑 Key format issue detected!");
      console.error("Make sure private key is in correct PEM format");
    }
    
    console.error("Error stack:", error.stack);
   
    throw error;
  }
};