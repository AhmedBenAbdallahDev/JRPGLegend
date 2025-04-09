export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent mb-4"></div>
      <h2 className="text-lg font-medium text-gray-400">Loading...</h2>
    </div>
  );
}
