import { PrismaClient } from '@prisma/client';
import { getGameCoverUrl } from '@/lib/screenscraper';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(request, { params }) {
  try {
    const { slug } = params;
    
    if (!slug) {
      return new Response('Game slug is required', { status: 400 });
    }
    
    // Get the game info from the database
    const game = await prisma.game.findUnique({
      where: { slug },
      select: {
        id: true,
        title: true,
        image: true,
        core: true
      }
    });
    
    if (!game) {
      return new Response('Game not found', { status: 404 });
    }
    
    // Check if this is a ScreenScraper reference
    if (game.image && game.image.startsWith('screenscraper:')) {
      // Format: screenscraper:GameTitle:core
      const parts = game.image.split(':');
      if (parts.length !== 3) {
        return new Response('Invalid ScreenScraper reference format', { status: 400 });
      }
      
      const gameTitle = decodeURIComponent(parts[1]);
      const core = parts[2];
      
      // Get the cover URL from ScreenScraper
      const coverUrl = await getGameCoverUrl(gameTitle, core);
      
      if (!coverUrl) {
        return new Response('Cover not found', { status: 404 });
      }
      
      // Redirect to the actual image URL
      return NextResponse.redirect(coverUrl);
    }
    
    // If it's a regular image, redirect to the image in the public folder
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_URL || ''}/game/${game.image}`);
    
  } catch (error) {
    console.error('Error fetching game image:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
} 