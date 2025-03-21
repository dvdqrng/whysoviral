// Create a placeholder component to replace the missing import
const ApiUsageStats = () => {
  return (
    <div className="p-4 border rounded-lg bg-gray-50 text-center">
      API usage statistics are currently unavailable
    </div>
  );
};

export const metadata = {
  title: "API Usage Dashboard",
  description: "Monitor and manage your API usage and costs",
}

export default function ApiUsagePage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">API Usage</h1>
      <ApiUsageStats />
    </div>
  )
} 