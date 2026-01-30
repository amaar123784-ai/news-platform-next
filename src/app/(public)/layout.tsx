export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <main className="container mx-auto px-4 py-6 min-h-screen">
            {children}
        </main>
    );
}
