"use client";
import React, { useEffect } from "react";
import posthog from "posthog-js";

// This file acts as both the error page and the global error boundary for Next.js App Router
// If used as a page, it reads error info from query params
// If used as a global error boundary, it reads error info from the error object

interface ErrorPageProps {
  error_code?: number | string;
  error_message_title?: string;
  error_message_body?: string;
  error_message_human_body?: string;
  error?: Error & { digest?: string };
  reset?: () => void;
}

export default function ErrorPage(props: ErrorPageProps) {
  // Try to get error info from props, error object, or from search params (for client-side redirects)
  let { error_code, error_message_title, error_message_body, error_message_human_body, error } = props;

  // Capture error with PostHog when error boundary is triggered
  useEffect(() => {
    if (error) {
      posthog.captureException(error);
    }
  }, [error]);

  // If this is a global error boundary call, parse error fields from error.message if possible
  if (error && (!error_code || !error_message_title)) {
    try {
      const parsed = JSON.parse(error.message);
      error_code = parsed.error_code;
      error_message_title = parsed.error_message_title;
      error_message_body = parsed.error_message_body;
      error_message_human_body = parsed.error_message_human_body;
    } catch {
      error_code = error_code || 500;
      error_message_title = error_message_title || error.name || "Unknown Error";
      error_message_body = error_message_body || error.message || "An unexpected error occurred.";
      error_message_human_body = error_message_human_body || "Something went wrong. Please try again or contact support.";
    }
  }

  // If running as a page, try to get from URL (for client-side navigation)
  if (typeof window !== "undefined" && (!error_code || !error_message_title)) {
    const params = new URLSearchParams(window.location.search);
    error_code = error_code || params.get("error_code") || undefined;
    error_message_title = error_message_title || params.get("error_message_title") || undefined;
    error_message_body = error_message_body || params.get("error_message_body") || undefined;
    error_message_human_body = error_message_human_body || params.get("error_message_human_body") || undefined;
  }

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <h3 className="mt-3 text-center text-3xl font-bold text-red-700">Error {error_code}</h3>
      <h6 className="text-center text-lg font-semibold mb-2">{error_message_title}</h6>
      <div className="flex justify-center">
        <img
            src="../images/sad_balloon.jpg"
            width={500}
            alt="Cornell Lifted Logo"
            className="rounded my-4"
          />
      </div>
      <p className="mt-3 text-center text-gray-700">{error_message_body}</p>
      <p className="mt-3 text-center text-gray-700">{error_message_human_body}</p>
      <p className="mt-3 text-center">
        If you think this is an error or you are still having issues, please email {" "}
        <a href="mailto:lifted@cornell.edu" className="text-blue-600 underline">lifted@cornell.edu</a>
      </p>
    </div>
  );
}
