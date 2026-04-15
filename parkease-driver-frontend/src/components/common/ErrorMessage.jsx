import { AlertCircle } from 'lucide-react';

export default function ErrorMessage({ message = 'Something went wrong. Please try again.' }) {
  return (
    <div className="flex items-start gap-3 bg-red-50 border border-red-200 
                    rounded-xl p-4 text-red-600">
      <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}