"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function GameForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    game_url: '',
    image: ''
  });
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'title') {
      setFormData({
        ...formData,
        title: value,
        slug: value.toLowerCase().replace(/\s+/g, '-')
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleCategoryKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = newCategory.trim();
      if (value && !selectedCategories.includes(value)) {
        setSelectedCategories([...selectedCategories, value]);
        setNewCategory('');
      }
    }
  };

  const removeCategory = (categoryToRemove) => {
    setSelectedCategories(selectedCategories.filter(cat => cat !== categoryToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const gameData = {
        ...formData,
        categories: selectedCategories.map(cat => ({
          title: cat,
          slug: cat.toLowerCase().replace(/\s+/g, '-')
        }))
      };

      const response = await fetch('/api/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(gameData),
      });

      if (!response.ok) throw new Error('Failed to add game');
      
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Error adding game:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Title</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          className="w-full p-2 bg-dark border border-accent-secondary rounded"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Slug</label>
        <input
          type="text"
          name="slug"
          value={formData.slug}
          onChange={handleInputChange}
          className="w-full p-2 bg-dark border border-accent-secondary rounded"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Game URL</label>
        <input
          type="url"
          name="game_url"
          value={formData.game_url}
          onChange={handleInputChange}
          className="w-full p-2 bg-dark border border-accent-secondary rounded"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Image URL</label>
        <input
          type="url"
          name="image"
          value={formData.image}
          onChange={handleInputChange}
          className="w-full p-2 bg-dark border border-accent-secondary rounded"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Categories (Press Enter to add)
        </label>
        <input
          type="text"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          onKeyDown={handleCategoryKeyDown}
          className="w-full p-2 bg-dark border border-accent-secondary rounded"
          placeholder="Type category and press Enter"
        />
        
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedCategories.map((category, index) => (
            <span 
              key={index}
              className="bg-accent-secondary px-2 py-1 rounded flex items-center"
            >
              {category}
              <button
                type="button"
                className="ml-2 text-red-500"
                onClick={() => removeCategory(category)}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-accent hover:bg-accent-hover text-white py-2 px-4 rounded transition duration-200"
      >
        Add Game
      </button>
    </form>
  );
} 