import { NextResponse } from "next/server";
import {
  CONTENT_SECURITY_POLICY,
  SECURITY_HEADERS,
} from "./lib/security-headers";

export function proxy() {
  const response = NextResponse.next();

  for (const header of SECURITY_HEADERS) {
    response.headers.set(header.key, header.value);
  }
  response.headers.set("Content-Security-Policy", CONTENT_SECURITY_POLICY);

  return response;
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
