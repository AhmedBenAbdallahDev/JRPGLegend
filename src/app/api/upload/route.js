'use server';

import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// Handle file upload
export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const directory = formData.get('directory') || 'game'; // Default to 'game' directory
    
    if (!file) {
      console.error('[upload] No file uploaded');
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Get file details
    const originalFilename = file.name;
    const fileType = file.type;
    
    console.log(`[upload] Received file: ${originalFilename}, type: ${fileType}, target directory: ${directory}`);
    
    // Convert to buffer for saving to disk
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Preserve original extension or use a default based on MIME type
    const fileExt = originalFilename.includes('.') 
      ? originalFilename.split('.').pop() 
      : fileType.split('/')[1] || 'jpg';
    
    // Create a safe filename with the original extension
    const filename = originalFilename
      .replace(/\s+/g, '_')  // Replace spaces with underscores
      .replace(/[^a-zA-Z0-9_.-]/g, '') // Remove any non-alphanumeric chars except underscore, period, hyphen
      .toLowerCase();
    
    console.log(`[upload] Sanitized filename: ${filename}`);
    
    // Make sure the target directory exists
    const uploadDir = join(process.cwd(), 'public', directory);
    if (!existsSync(uploadDir)) {
      console.log(`[upload] Creating upload directory: ${uploadDir}`);
      await mkdir(uploadDir, { recursive: true });
    }
    
    // Write the file to disk
    const filepath = join(uploadDir, filename);
    await writeFile(filepath, buffer);
    
    console.log(`[upload] File saved successfully: ${filepath}`);
    
    // Return the path for storing in the database
    return NextResponse.json({
      success: true,
      filename: filename,
      originalName: originalFilename,
      path: `/${directory}/${filename}`,
      size: buffer.length
    });
    
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: `Error uploading file: ${error.message}` },
      { status: 500 }
    );
  }
} 