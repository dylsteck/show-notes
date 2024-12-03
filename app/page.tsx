'use client'

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToastProvider } from "@/components/ui/toast";
import { Trash2, Link as LinkIcon, Share, Plus, CopyIcon } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useToast } from '@/hooks/use-toast';

type LinkItem = {
  id: string;
  url: string;
  title: string;
  originalTitle: string;
};

export default function Home() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [selectedLink, setSelectedLink] = useState<LinkItem | null>(null);
  const [newUrl, setNewUrl] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const queryLinks = new URLSearchParams(window.location.search).get('links');
    const storedLinks = queryLinks ? decodeURIComponent(queryLinks) : localStorage.getItem('links');

    try {
      const parsedLinks = storedLinks ? JSON.parse(storedLinks) : [];
      setLinks(parsedLinks);
      if (parsedLinks.length > 0) {
        setSelectedLink(parsedLinks[parsedLinks.length - 1]);
      }
    } catch {
      console.error('Error parsing stored links JSON.');
    }
  }, []);

  useEffect(() => {
    const serializedLinks = JSON.stringify(links);
    localStorage.setItem('links', serializedLinks);
    const encodedLinks = encodeURIComponent(serializedLinks);
    const newUrl = `${window.location.pathname}?links=${encodedLinks}`;
    window.history.replaceState(null, '', newUrl);
  }, [links]);

  const addLink = async (url: string) => {
    const text = await getTextFromUrl(url);
    const title = text || 'Untitled';
    const newLink: LinkItem = {
      id: crypto.randomUUID(),
      url,
      title,
      originalTitle: title,
    };
    const updatedLinks = [...links, newLink];
    setLinks(updatedLinks);
    setSelectedLink(newLink);
    setNewUrl('');
  };

  const getTextFromUrl = async (url: string) => {
    try {
      const response = await fetch(`/api/metadata?url=${encodeURIComponent(url)}`);
      const { title } = await response.json();
      return title;
    } catch {
      return url;
    }
  };

  const duplicateLink = (link: LinkItem) => {
    const duplicatedLink: LinkItem = {
      ...link,
      id: crypto.randomUUID(),
      title: `Copy of ${link.title}`,
    };
    const updatedLinks = [...links, duplicatedLink];
    setLinks(updatedLinks);
    setSelectedLink(duplicatedLink);
  };

  const deleteLink = (link: LinkItem) => {
    const updatedLinks = links.filter((l) => l.id !== link.id);
    setLinks(updatedLinks);
    if (selectedLink && selectedLink.id === link.id) {
      setSelectedLink(updatedLinks.length > 0 ? updatedLinks[updatedLinks.length - 1] : null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Shareable Link Copied',
      description: 'The link has been copied to your clipboard.',
    });
  };

  const shareCurrentState = () => {
    const encodedLinks = encodeURIComponent(JSON.stringify(links));
    const shareUrl = `${window.location.origin}${window.location.pathname}?links=${encodedLinks}`;
    copyToClipboard(shareUrl);
  };

  return (
    <ToastProvider>
      <div className="flex h-screen bg-white">
        <div className="w-80 h-screen flex flex-col bg-gray-50 border-r border-gray-200 overflow-hidden">
          <div className="p-4 border-b bg-white flex items-center space-x-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newUrl) { addLink(newUrl); }
              }}
              className="flex space-x-2 flex-1"
            >
              <Input
                type="url"
                placeholder="Enter URL"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                required
                className="flex-1"
              />
              <Button type="submit" className="flex items-center">
                <Plus className="mr-2 h-4 w-4" /> Add
              </Button>
            </form>
            <Button
              variant="ghost"
              size="icon"
              onClick={shareCurrentState}
            >
              <Share className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => copyToClipboard(links.map((l) => `${l.title}: ${l.url}`).join('\n'))}
            >
              <CopyIcon className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ul className="space-y-2 p-4">
              {links.map((link) => (
                <li
                  key={link.id}
                  className={cn(
                    "p-2 rounded-lg flex items-center justify-between border hover:bg-gray-100 transition cursor-pointer",
                    selectedLink?.id === link.id ? 'bg-blue-50 border-blue-300' : 'border-gray-200'
                  )}
                  onClick={() => setSelectedLink(link)}
                >
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-semibold truncate">{link.title}</p>
                    <p className="text-sm text-gray-500 truncate">{link.url}</p>
                  </div>
                  <div className="flex flex-row items-center space-x-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicateLink(link);
                      }}
                    >
                      <CopyIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteLink(link);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex-1 relative">
          {selectedLink ? (
            <>
              <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50">
                <h1 className="text-lg font-semibold truncate max-w-[70%]">
                  {selectedLink.title}
                </h1>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(selectedLink.url)}
                  >
                    <LinkIcon className="mr-2 h-4 w-4" /> Copy URL
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => window.open(selectedLink.url, '_blank')}
                  >
                    Open in New Tab
                  </Button>
                </div>
              </div>
              <iframe
                src={selectedLink.url}
                title={selectedLink.title}
                className="w-full h-[calc(100%-50px)] border-none absolute bottom-0"
                sandbox="allow-scripts allow-same-origin"
              />
            </>
          ) : (
            <div className="flex items-center justify-center text-gray-500 h-full">
              No link selected
            </div>
          )}
        </div>
      </div>
    </ToastProvider>
  );
}