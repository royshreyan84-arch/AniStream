import Link from 'next/link';
import React from 'react';

export default function Footer(): React.JSX.Element {
  return (
    <footer className="w-full bg-[#0b0e14] text-gray-400 py-8 px-4 flex flex-col items-center border-t border-gray-800">
      {/* Brand Logo */}
      <div className="text-2xl font-bold text-white tracking-wide mb-4 flex items-center gap-1">
        ani<span className="text-blue-500">stream</span>
      </div>

      {/* Join Community Button */}
      <div className="bg-[#1e232b] rounded-full px-6 py-2 flex items-center gap-3 mb-6 shadow-md">
        <span className="text-sm font-medium text-gray-200">Join now</span>
        
        <a 
          href="https://discord.gg/v9QWz68Mu" 
          target="_blank" 
          rel="noopener noreferrer"
          className="hover:text-blue-400 transition-colors duration-200"
          aria-label="Join our Discord server"
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 127.14 96.36">
            <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.86,54.65,1,77.53A105.73,105.73,0,0,0,32,96.36a74.37,74.37,0,0,0,6.72-11A68.52,68.52,0,0,1,27,79.83c.95-.7,1.88-1.43,2.77-2.19a74.67,74.67,0,0,0,67.62,0c.9,1.15,1.82,1.88,2.77,2.19a68.52,68.52,0,0,1-11.77,5.53,74.37,74.37,0,0,0,6.72,11,105.73,105.73,0,0,0,31.6-18.83C129.58,49.7,123.41,26.85,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.93,46,53.79,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.17,46,96,53,91,65.69,84.69,65.69Z"/>
          </svg>
        </a>
      </div>

      {/* Navigation Links */}
      <div className="flex gap-6 text-sm mb-6 font-medium">
        <Link href="/help" className="hover:text-white transition-colors">Help</Link>
        <Link href="/request" className="hover:text-white transition-colors">Request Anime</Link>
        
        {/* Mailto link setup perfectly inline inside the row */}
        <a 
          href="mailto:contact.anistream@gmail.com?subject=AniStream%20Inquiry" 
          className="hover:text-white transition-colors"
        >
          Contact
        </a>
      </div>

      {/* Copyright Disclaimer */}
      <div className="text-center text-xs max-w-xl text-gray-500 space-y-2">
        <p>Copyright © 2026-27 anistream.live. All Rights Reserved</p>
        <p className="px-4 leading-relaxed">
          This site does not store any files on its server. All contents are provided by non-affiliated third parties.
        </p>
      </div>
    </footer>
  );
}