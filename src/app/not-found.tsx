import Link from "next/link";

export default function NotFound() {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-background text-foreground font-sans">
        <div className="text-center p-6 space-y-4">
          <h1 className="text-4xl font-black">404</h1>
          <p className="text-muted-foreground">Page Not Found</p>
          <Link href="/en" className="underline font-bold text-primary">
            Return to Furni Gebeya
          </Link>
        </div>
      </body>
    </html>
  );
}
