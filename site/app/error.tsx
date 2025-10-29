"use client";

import { useEffect } from "react";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";

/**
 * Error page that logs the error and redirects to homepage.
 *
 * @param {Object} props - The component props.
 * @returns The error page component.
 */
export default function Error({ error }: { error: Error }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-full w-full flex-col text-center items-center justify-center p-4">
      <h1 className="mb-4 text-6xl max-w-2xl font-bold text-default-800">
        Something went wrong!
      </h1>
      <p className="mb-8 text-xl max-w-xl text-default-600">
        Well, this is awkward. We seem to have misplaced this page. It's
        probably off having an existential crisis somewhere.
      </p>
      <Button as={Link} variant="ghost" color="primary" href="/">
        Go back to the home page
      </Button>
    </div>
  );
}
