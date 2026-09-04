"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "./LanguageProvider";

type LanyardData = {
  data?: {
    discord_status: string;
    discord_user: {
      username: string;
      avatar: string;
      id: string;
      display_name?: string;
    };
    activities: any[];
    listening_to_spotify: boolean;
    spotify?: {
      song: string;
      artist: string;
      album: string;
      album_art_url: string;
      timestamps?: {
        start: number;
        end: number;
      };
    };
  };
};

export default function DiscordCard({ userId }: { userId: string }) {
  const [data, setData] = useState<LanyardData["data"] | null>(null);
  const { lang } = useLanguage();

  useEffect(() => {
    let ws: WebSocket;
    let heartbeatInterval: NodeJS.Timeout;

    const connect = () => {
      ws = new WebSocket("wss://api.lanyard.rest/socket");

      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            op: 2,
            d: { subscribe_to_id: userId },
          })
        );
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.op === 1) {
          heartbeatInterval = setInterval(() => {
            ws.send(JSON.stringify({ op: 3 }));
          }, msg.d.heartbeat_interval);
        }
        if (msg.t === "INIT_STATE" || msg.t === "PRESENCE_UPDATE") {
          setData(msg.d);
        }
      };

      ws.onclose = () => {
        clearInterval(heartbeatInterval);
        setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      if (ws) ws.close();
      clearInterval(heartbeatInterval);
    };
  }, [userId]);

  if (!data) return null;

  const statusColor =
    data.discord_status === "online"
      ? "bg-emerald-500"
      : data.discord_status === "idle"
      ? "bg-amber-500"
      : data.discord_status === "dnd"
      ? "bg-red-500"
      : "bg-gray-500";

  const statusGlow =
    data.discord_status === "online"
      ? "shadow-[0_0_12px_rgba(16,185,129,0.4)]"
      : data.discord_status === "idle"
      ? "shadow-[0_0_12px_rgba(245,158,11,0.4)]"
      : data.discord_status === "dnd"
      ? "shadow-[0_0_12px_rgba(239,68,68,0.4)]"
      : "";

  const statusLabel =
    data.discord_status === "online"
      ? lang === "fr" ? "En ligne" : "Online"
      : data.discord_status === "idle"
      ? lang === "fr" ? "Inactif" : "Idle"
      : data.discord_status === "dnd"
      ? lang === "fr" ? "Ne pas d\u00e9ranger" : "Do Not Disturb"
      : lang === "fr" ? "Hors ligne" : "Offline";

  // VS Code activity
  const vscode = (data.activities || []).find(
    (a) => a.name === "Visual Studio Code" || a.name === "Code"
  );

  // Generic game / app activity (not Spotify, not Custom Status)
  const gameActivity = (data.activities || []).find(
    (a) => a.type === 0 && a.name !== "Visual Studio Code" && a.name !== "Code"
  );

  const avatarUrl = data.discord_user?.avatar
    ? `https://cdn.discordapp.com/avatars/${data.discord_user.id}/${data.discord_user.avatar}.webp?size=128`
    : null;

  const displayName = data.discord_user?.display_name || data.discord_user?.username || "NeXoS_20";

  return (
    <div className="w-full max-w-xs rounded-xl bg-ink-1/80 border border-ice-700/30 backdrop-blur-md overflow-hidden pointer-events-auto fade-in-up" style={{ ["--d" as string]: "800ms" }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-3">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-10 h-10 rounded-full ring-2 ring-ice-700/40"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-ice-600 ring-2 ring-ice-700/40 flex items-center justify-center text-white font-bold text-sm">
              N
            </div>
          )}
          {/* Status dot */}
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-ink-1 ${statusColor} ${statusGlow}`}
          />
        </div>
        {/* Name + status */}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ice-100 truncate">{displayName}</p>
          <p className="text-[11px] text-ice-400">{statusLabel}</p>
        </div>
        {/* Discord icon */}
        <svg viewBox="0 0 24 24" className="w-5 h-5 ml-auto text-ice-500/60 flex-shrink-0" fill="currentColor" aria-hidden>
          <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z" />
        </svg>
      </div>

      {/* Divider */}
      <div className="h-px bg-ice-700/20 mx-3" />

      {/* Activity section */}
      <div className="px-4 py-3 space-y-2.5">
        {/* Spotify */}
        {data.listening_to_spotify && data.spotify && (
          <div className="flex items-center gap-3">
            <img
              src={data.spotify.album_art_url}
              alt={data.spotify.album}
              className="w-11 h-11 rounded-md flex-shrink-0"
            />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-medium flex items-center gap-1.5">
                <svg viewBox="0 0 24 24" className="w-3 h-3" fill="currentColor" aria-hidden>
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.1-10.561-1.14-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.56 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.3c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                </svg>
                Spotify
              </p>
              <p className="text-xs text-ice-100 font-medium truncate">{data.spotify.song}</p>
              <p className="text-[11px] text-ice-400 truncate">{data.spotify.artist}</p>
            </div>
          </div>
        )}

        {/* VS Code */}
        {vscode && (
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-md bg-[#1e1e2e] flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#007acc]" fill="currentColor" aria-hidden>
                <path d="M23.15 2.587L18.21.21a1.494 1.494 0 00-1.705.29l-9.46 8.63-4.12-3.128a.999.999 0 00-1.276.057L.327 7.261A1 1 0 00.326 8.74L3.899 12 .326 15.26a1 1 0 00.001 1.479L1.65 17.94a.999.999 0 001.276.057l4.12-3.128 9.46 8.63a1.492 1.492 0 001.704.29l4.942-2.377A1.5 1.5 0 0024 20.06V3.939a1.5 1.5 0 00-.85-1.352zm-5.146 14.861L10.826 12l7.178-5.448v10.896z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-[#007acc] font-medium">VS Code</p>
              <p className="text-xs text-ice-100 font-medium truncate">{vscode.details || "Coding"}</p>
              {vscode.state && (
                <p className="text-[11px] text-ice-400 truncate">{vscode.state}</p>
              )}
            </div>
          </div>
        )}

        {/* Game activity */}
        {gameActivity && !vscode && (
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-md bg-ice-700/20 flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-ice-400" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M6 12h12M12 6v12" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-ice-500 font-medium">{lang === "fr" ? "Joue \u00e0" : "Playing"}</p>
              <p className="text-xs text-ice-100 font-medium truncate">{gameActivity.name}</p>
              {gameActivity.details && (
                <p className="text-[11px] text-ice-400 truncate">{gameActivity.details}</p>
              )}
            </div>
          </div>
        )}

        {/* No activity fallback */}
        {!data.listening_to_spotify && !vscode && !gameActivity && data.discord_status !== "offline" && (
          <p className="text-[11px] text-ice-500 italic">
            {lang === "fr" ? "Aucune activit\u00e9 en cours" : "No current activity"}
          </p>
        )}
      </div>
    </div>
  );
}

