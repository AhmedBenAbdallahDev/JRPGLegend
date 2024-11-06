import Image from "next/image"
import Search from "@/components/Search"
import MobileNav from "@/components/MobileNav"
import { Cog8ToothIcon } from "@heroicons/react/24/outline"
import Link from "next/link"

export default function Header() {
  return ( 
    <header className="px-4 flex h-14 shrink-0 items-center gap-4">
      <a href="/" className="flex items-center gap-2">
        <Image src="/logo.svg" alt="TheNextGameStation" width={116.56} height={33.8} loading="eager"/>
      </a>

      <Search/>

      <nav className="flex gap-4 md:gap-6">
        <a href="#">
          <Cog8ToothIcon className="w-6 h-6"/>
        </a>

        <MobileNav />
      </nav>

      <Link 
        href="/game/add" 
        className="text-sm bg-accent-gradient py-2 px-4 rounded-xl border border-yellow-400 uppercase"
      >
        Add Game
      </Link>

    </header>
  )
}