import React from 'react';
import Link from 'next/link';
import { SiPlaystation, SiSega } from 'react-icons/si';
import { FaGamepad, FaMobileAlt } from 'react-icons/fa';
import { IoGameController } from 'react-icons/io5';

export const metadata = {
  title: 'Supported Gaming Platforms - JRPGLegend',
  description: 'Explore all the retro gaming platforms supported by our emulation system'
};

// Function to get the appropriate icon for each platform category
const getCategoryIcon = (slug) => {
  const iconSize = 24;
  
  switch (slug) {
    case 'nes':
    case 'snes':
      return <FaGamepad size={iconSize} />;
    case 'n64':
      return <FaGamepad size={iconSize} />;
    case 'gb':
    case 'gbc':
    case 'gba':
      return <FaMobileAlt size={iconSize} />;
    case 'nds':
      return <FaGamepad size={iconSize} />;
    case 'genesis':
    case 'segacd':
    case 'saturn':
      return <SiSega size={iconSize} />;
    case 'psx':
    case 'psp':
      return <SiPlaystation size={iconSize} />;
    case 'arcade':
      return <FaGamepad size={iconSize} />;
    default:
      return <FaGamepad size={iconSize} />;
  }
};

const PlatformCard = ({ name, core, abbreviation, year, color, slug }) => (
  <div className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
    <div className={`${color} p-4 text-white`}>
      <h3 className="text-xl font-bold">{name}</h3>
      <p className="text-sm opacity-80">{abbreviation} · {year}</p>
    </div>
    <div className="p-4">
      <div className="flex items-center justify-center mb-4 text-accent">
        {getCategoryIcon(slug)}
      </div>
      <p className="text-sm text-gray-600 mb-4">Core: <code className="bg-gray-100 px-1 py-0.5 rounded">{core}</code></p>
      <Link 
        href={`/category/${slug}`} 
        className="text-sm text-accent font-medium hover:underline"
      >
        View Games →
      </Link>
    </div>
  </div>
);

export default function PlatformsPage() {
  const platforms = [
    { 
      name: 'Nintendo Entertainment System', 
      abbreviation: 'NES', 
      core: 'nes',
      slug: 'nes',
      year: '1983',
      color: 'bg-red-600'
    },
    { 
      name: 'Super Nintendo', 
      abbreviation: 'SNES', 
      core: 'snes',
      slug: 'snes',
      year: '1990',
      color: 'bg-purple-600'
    },
    { 
      name: 'Nintendo 64', 
      abbreviation: 'N64', 
      core: 'n64',
      slug: 'n64',
      year: '1996',
      color: 'bg-green-600'
    },
    { 
      name: 'Game Boy', 
      abbreviation: 'GB', 
      core: 'gb',
      slug: 'gb',
      year: '1989',
      color: 'bg-gray-600'
    },
    { 
      name: 'Game Boy Color', 
      abbreviation: 'GBC', 
      core: 'gbc',
      slug: 'gbc',
      year: '1998',
      color: 'bg-yellow-500'
    },
    { 
      name: 'Game Boy Advance', 
      abbreviation: 'GBA', 
      core: 'gba',
      slug: 'gba',
      year: '2001',
      color: 'bg-indigo-600'
    },
    { 
      name: 'Nintendo DS', 
      abbreviation: 'NDS', 
      core: 'nds',
      slug: 'nds',
      year: '2004',
      color: 'bg-blue-500'
    },
    { 
      name: 'PlayStation', 
      abbreviation: 'PSX', 
      core: 'psx',
      slug: 'psx',
      year: '1994',
      color: 'bg-gray-800'
    },
    { 
      name: 'PlayStation Portable', 
      abbreviation: 'PSP', 
      core: 'psp',
      slug: 'psp',
      year: '2004',
      color: 'bg-black'
    },
    { 
      name: 'Sega Genesis', 
      abbreviation: 'Genesis', 
      core: 'segaMD',
      slug: 'genesis',
      year: '1988',
      color: 'bg-red-700'
    },
    { 
      name: 'Sega CD', 
      abbreviation: 'Sega CD', 
      core: 'segaCD',
      slug: 'segacd',
      year: '1991',
      color: 'bg-red-800'
    },
    { 
      name: 'Sega Saturn', 
      abbreviation: 'Saturn', 
      core: 'segaSaturn',
      slug: 'saturn',
      year: '1994',
      color: 'bg-gray-700'
    },
    { 
      name: 'Arcade', 
      abbreviation: 'Arcade', 
      core: 'arcade',
      slug: 'arcade',
      year: 'Various',
      color: 'bg-purple-800'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-screen-xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Supported Gaming Platforms</h1>
        <p className="text-gray-600 mb-6">
          Our application supports a wide range of classic gaming systems through high-quality emulation.
          Browse games by platform or add your own ROMs to expand your collection.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {platforms.map((platform) => (
            <PlatformCard 
              key={platform.core}
              name={platform.name}
              abbreviation={platform.abbreviation}
              core={platform.core}
              slug={platform.slug}
              year={platform.year}
              color={platform.color}
            />
          ))}
        </div>
      </div>
    </div>
  );
} 