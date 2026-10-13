import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { authors, authorBooks, isReadable } from '../lib/catalog';
import { SITE_URL } from '../lib/seo';
import { ReadingProvider } from '../components/ReadingProvider';
import { ThemeFrame, Footer } from '../components/LocalReading';
import { Navigation } from '../components/Navigation';
import './globals.css';
export const metadata:Metadata={metadataBase:new URL(SITE_URL),title:{default:'ଅକ୍ଷରଧାରା · Aksharadhara',template:'%s | ଅକ୍ଷରଧାରା'},description:'ଅକ୍ଷରରୁ ଅନନ୍ତ ଯାତ୍ରା… A free, open Odia digital library with a thoughtful text-native reading experience.',applicationName:'Aksharadhara',manifest:'/manifest.webmanifest',icons:{icon:'/icons/icon.svg',apple:'/icons/icon-192.png'},openGraph:{siteName:'Aksharadhara',locale:'or_IN',type:'website',images:[{url:'/social-cover.png',width:1200,height:630,alt:'ଅକ୍ଷରଧାରା · Aksharadhara Odia library'}]},twitter:{card:'summary_large_image',images:['/social-cover.png']}};
export const viewport:Viewport={width:'device-width',initialScale:1,themeColor:[{media:'(prefers-color-scheme: light)',color:'#f6f1e7'},{media:'(prefers-color-scheme: dark)',color:'#19231f'}]};
export default function RootLayout({children}:{children:ReactNode}){return <html lang="or"><body><ReadingProvider><ThemeFrame><a className="skip-link" href="#main">Skip to content · ମୁଖ୍ୟ ପାଠ୍ୟକୁ ଯାଆନ୍ତୁ</a><Navigation authors={authors.filter(a=>a.verified&&!a.demo).map(a=>({...a,bookCount:authorBooks(a.id).filter(isReadable).length}))}/><main id="main" tabIndex={-1}>{children}</main><Footer/></ThemeFrame></ReadingProvider></body></html>;}
