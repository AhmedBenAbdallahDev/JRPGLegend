import React, { useState } from 'react';

// Add a multiselect or free input for categories
const AddGamePage = () => {
  // ... existing code ...

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      // ... existing form data ...
      
      const formData = {
        // ... other fields ...
        categories: selectedCategories.map(cat => ({
          title: cat,
          slug: cat.toLowerCase().replace(/\s+/g, '-')
        }))
      };

      // Make your API call here
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* ... existing form fields ... */}
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Categories (Press Enter to add)
        </label>
        <input
          type="text"
          className="w-full p-2 border rounded"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const value = e.currentTarget.value.trim();
              if (value && !selectedCategories.includes(value)) {
                setSelectedCategories([...selectedCategories, value]);
                e.currentTarget.value = '';
              }
            }
          }}
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedCategories.map((cat, index) => (
            <span 
              key={index} 
              className="bg-blue-100 px-2 py-1 rounded flex items-center"
            >
              {cat}
              <button
                type="button"
                className="ml-2 text-red-500"
                onClick={() => setSelectedCategories(
                  selectedCategories.filter((_, i) => i !== index)
                )}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* ... rest of the form ... */}
    </form>
  );
}; 