'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import EnhancedGameCover from './EnhancedGameCover';

// This component now serves as a wrapper around EnhancedGameCover
// for backward compatibility
export default function GameCover(props) {
  return <EnhancedGameCover {...props} />;
} 