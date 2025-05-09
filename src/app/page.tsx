import Image from "next/image";
import ProposalForm from "../components/ProposalForm";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <header className="max-w-7xl mx-auto mb-12 text-center">
        <div className="inline-block bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm mb-6">
          <Image
            className="dark:invert"
            src="/next.svg"
            alt="Next.js logo"
            width={120}
            height={30}
            priority
          />
        </div>
        <h1 className="text-4xl font-bold mb-2">DAO Governance Portal</h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Submit your proposal to improve the protocol and shape its future
        </p>
      </header>

      <main className="max-w-7xl mx-auto">
        <ProposalForm />
      </main>

      <footer className="max-w-7xl mx-auto mt-16 text-center text-gray-500 text-sm">
        <p>Built with Next.js, TypeScript, and Tailwind CSS</p>
      </footer>
    </div>
  );
}
