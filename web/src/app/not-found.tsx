import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4">
      <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center font-bold text-xl text-muted-foreground border border-border">
        404
      </div>
      <h2 className="text-xl font-semibold tracking-tight text-foreground">
        Page Not Found
      </h2>
      <p className="text-sm text-muted-foreground max-w-sm">
        The requested page does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
      >
        Return to Dashboard
      </Link>
    </div>
  );
}
