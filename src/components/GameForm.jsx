'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function GameForm({ categories = [] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: '',
    gameLink: '',
    core: '',
    category: { id: '', title: '' }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          published: true
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add game');
      }

      router.push('/');
      router.refresh();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCategoryChange = (e) => {
    const { value } = e.target;
    const existingCategory = categories.find(cat => cat.id.toString() === value);
    
    if (existingCategory) {
      setFormData(prev => ({
        ...prev,
        category: { id: existingCategory.id, title: existingCategory.title }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        category: { id: '', title: value }
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label className="block mb-2">Game Title *</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="w-full p-3 rounded bg-primary border border-accent-secondary"
          required
          placeholder="Enter game title"
        />
      </div>

      <div>
        <label className="block mb-2">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="w-full p-3 rounded bg-primary border border-accent-secondary"
          rows="3"
          placeholder="Game description"
        />
      </div>

      <div>
        <label className="block mb-2">Image URL</label>
        <input
          type="text"
          name="image"
          value={formData.image}
          onChange={handleChange}
          className="w-full p-3 rounded bg-primary border border-accent-secondary"
          placeholder="URL to game cover image"
        />
      </div>

      <div>
        <label className="block mb-2">Category *</label>
        <div className="flex gap-4">
          <select
            value={formData.category.id}
            onChange={handleCategoryChange}
            className="w-1/2 p-3 rounded bg-primary border border-accent-secondary"
          >
            <option value="">Select or type new category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.title}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={formData.category.title}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              category: { id: '', title: e.target.value }
            }))}
            className="w-1/2 p-3 rounded bg-primary border border-accent-secondary"
            placeholder="Or type new category name"
          />
        </div>
      </div>

      <div>
        <label className="block mb-2">Game ROM URL *</label>
        <input
          type="text"
          name="gameLink"
          value={formData.gameLink}
          onChange={handleChange}
          className="w-full p-3 rounded bg-primary border border-accent-secondary"
          required
          placeholder="URL to game ROM file"
        />
      </div>

      <div>
        <label className="block mb-2">Emulator Core *</label>
        <div className="flex gap-4">
          <select
            name="core"
            value={formData.core}
            onChange={handleChange}
            className="w-1/2 p-3 rounded bg-primary border border-accent-secondary"
          >
            <option value="">Select a core</option>
            <option value="snes">SNES</option>
            <option value="nes">NES</option>
            <option value="gba">Game Boy Advance</option>
            <option value="n64">Nintendo 64</option>
            <option value="segamd">Sega Genesis</option>
            <option value="arcade">Arcade</option>
            <option value="psx">PlayStation</option>
          </select>
          <input
            type="text"
            name="core"
            value={formData.core}
            onChange={handleChange}
            className="w-1/2 p-3 rounded bg-primary border border-accent-secondary"
            placeholder="Or type custom core"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-accent text-black p-3 rounded-xl font-medium hover:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Adding Game...' : 'Submit Game'}
      </button>
    </form>
  );
}