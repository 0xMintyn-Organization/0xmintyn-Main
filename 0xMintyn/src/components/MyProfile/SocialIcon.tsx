import { SocialAccount } from "@/lib/types";
import { RiTwitterXFill, RiDiscordFill, RiTelegramFill, RiCameraLensLine } from "react-icons/ri";
import { SiFarcaster } from "react-icons/si";

export default function SocialIcon({ platform }: {platform: SocialAccount['platform']}) {
    const getIconPath = () => {
      switch (platform.toLowerCase()) {
        case 'twitter':
          return (
            <RiTwitterXFill size={24} />
          );
        case 'discord':
          return (
            <RiDiscordFill size={24} />
          );
        case 'telegram':
          return (
            <RiTelegramFill size={24} />
          );
        case 'lens':
          return (
            <RiCameraLensLine size={24} />
          );
        case 'farcaster':
          return (
            <SiFarcaster size={24} />
          );
        default:
          return <span className="text-2xl">?</span>;
      }
    };
  
    return (
      <div className="text-gray-700">
        {getIconPath()}
      </div>
    );
  };