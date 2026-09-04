"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "./LanguageProvider";

type LanyardData = {
  data?: {
    discord_status: string;
    activities: any[];
    listening_to_spotify: boolean;
    spotify?: {
      song: string;
      artist: string;
    };
  };
};

export default function DiscordStatus({ userId }: { userId: string }) {
  const [data, setData] = useState<LanyardData["data"] | null>(null);
  const { lang } = useLanguage();

  useEffect(() => {
    let ws: WebSocket;
    let heartbeatInterval: NodeJS.Timeout;

    const connect = () => {
      ws = new WebSocket("wss://api.lanyard.rest/socket");

      ws.onopen = () => {
        // Send Initialize
        ws.send(
          JSON.stringify({
            op: 2,
            d: {
              subscribe_to_id: userId,
            },
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
        setTimeout(connect, 5000); // Reconnect after 5 seconds
      };
    };

    connect();

    return () => {
      if (ws) {
        ws.close();
      }
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

  let activityText = lang === "fr" ? "Hors ligne" : "Offline";
  if (data.discord_status !== "offline") {
    activityText = lang === "fr" ? "En ligne" : "Online";
  }

  // Find VS Code activity
  const vscode = (data.activities || []).find((a) => a.name === "Visual Studio Code" || a.name === "Code");
  if (vscode) {
    activityText = `VS Code: ${vscode.details || "Coding"}`;
  }

  // Spotify takes precedence if listening
  if (data.listening_to_spotify && data.spotify) {
    activityText = `Spotify: ${data.spotify.artist} - ${data.spotify.song}`;
  }

  return (
    <div
      className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-ink-2/60 border border-ice-700/70 backdrop-blur-sm"
      title="Live Discord Status"
    >
      <div className="relative flex h-2.5 w-2.5 items-center justify-center flex-shrink-0">
        {data.discord_status !== "offline" && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${statusColor}`}
          ></span>
        )}
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${statusColor}`}
        ></span>
      </div>
      <span className="text-[10px] uppercase tracking-widest text-ice-200 font-semibold truncate max-w-[200px]">
        {activityText}
      </span>
    </div>
  );
}


