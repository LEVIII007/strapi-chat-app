'use client';

import React, { useState, useEffect } from 'react';
import { User, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useSession, signOut, signIn } from 'next-auth/react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export default function Header() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [prevScrollPos, setPrevScrollPos] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      const currentScrollPos = window.scrollY;
      setVisible(prevScrollPos > currentScrollPos || currentScrollPos < 10);
      setPrevScrollPos(currentScrollPos);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [prevScrollPos]);

  if (!mounted) return null;

  return (
    <header
      className={`fixed w-full bg-background border-b border-border z-50 transition-transform duration-300 ${
        visible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="container mx-auto px-4 h-12 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex-shrink-0 flex items-center hover:opacity-80 transition-opacity"
        >
          <h1 className="text-base font-bold text-white">
            Ayna AI Chatbot
          </h1>
        </Link>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* User Menu */}
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-6 w-6 rounded-full">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={session.user?.image || ''} alt={session.user?.name || ''} />
                    <AvatarFallback>
                      {session.user?.name?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-gray-700 text-white">
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => signOut()} className="hover:bg-gray-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button 
              onClick={() => signIn('google')}
              className="bg-gray-700 hover:bg-gray-600 text-white rounded-full px-4 py-1 text-sm"
            >
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
