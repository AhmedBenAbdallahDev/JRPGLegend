'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function GameForm({ categories }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    image: '',
    game_url: '',
    published: true,  // Set default to true for public submissions
    categoryIds: []
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to add game');

      router.push('/');  // Redirect to home after submission
      router.refresh();
    } catch (error) {
      console.error('Error adding game:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl mx-auto">
      <div>
        <label className="block mb-2">Title</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          className="w-full p-2 rounded bg-secondary border border-accent-secondary"
          required
        />
      </div>

      <div>
        <label className="block mb-2">Game URL</label>
        <input
          type="url"
          value={formData.game_url}
          onChange={(e) => setFormData({...formData, game_url: e.target.value})}
          className="w-full p-2 rounded bg-secondary border border-accent-secondary"
          required
        />
      </div>

      <div>
        <label className="block mb-2">Image URL</label>
        <input
          type="text"
          value={formData.image}
          onChange={(e) => setFormData({...formData, image: e.target.value})}
          className="w-full p-2 rounded bg-secondary border border-accent-secondary"
        />
      </div>

      <div>
        <label className="block mb-2">Categories</label>
        <select
          multiple
          value={formData.categoryIds}
          onChange={(e) => setFormData({
            ...formData,
            categoryIds: Array.from(e.target.selectedOptions, option => option.value)
          })}
          className="w-full p-2 rounded bg-secondary border border-accent-secondary"
        >
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.title}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="w-full bg-accent text-black p-2 rounded hover:bg-accent/80"
      >
        Submit Game
      </button>
    </form>
  );
} 