import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

/**
 * POST handler for creating offline games
 * 
 * @param {Request} request - The incoming request
 * @returns {NextResponse} - JSON response with the created offline game data
 */
export async function POST(request) {
  try {
    const data = await request.json();
    
    // Validation
    if (!data.title?.trim()) {
      return NextResponse.json({ error: 'Game title is required' }, { status: 400 });
    }
    if (!data.gameLink?.trim()) {
      return NextResponse.json({ error: 'Game ROM file path is required' }, { status: 400 });
    }
    if (!data.core?.trim()) {
      return NextResponse.json({ error: 'Emulator core is required' }, { status: 400 });
    }

    // Create slug from title
    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    // Generate a unique ID for the offline game
    const id = uuidv4();
    
    // Create the offline game object
    const offlineGame = {
      id,
      title: data.title,
      slug,
      description: data.description || '',
      image: data.image || '',
      gameLink: data.gameLink,
      core: data.core,
      region: data.region || '',
      category: data.category || { id: '', title: 'Offline Games' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isOffline: true
    };
    
    return NextResponse.json(offlineGame, { status: 201 });
  } catch (error) {
    console.error('Error creating offline game:', error);
    return NextResponse.json(
      { error: 'Failed to create offline game: ' + error.message },
      { status: 500 }
    );
  }
} 