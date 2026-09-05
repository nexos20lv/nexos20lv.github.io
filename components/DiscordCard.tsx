"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "./LanguageProvider";

type DiscordActivity = {
  id: string;
  name: string;
  type: number; // 0 = Game/App, 1 = Streaming, 2 = Listening, 3 = Watching, 4 = Custom, 5 = Competing
  state?: string;
  details?: string;
  application_id?: string;
  timestamps?: {
    start?: number;
    end?: number;
  };
  assets?: {
    large_image?: string;
    large_text?: string;
    small_image?: string;
    small_text?: string;
  };
  emoji?: {
    id?: string;
    name: string;
    animated?: boolean;
  };
  buttons?: string[];
  sync_id?: string;
};

type LanyardSpotify = {
  song: string;
  artist: string;
  album: string;
  album_art_url: string;
  track_id?: string;
  timestamps?: {
    start: number;
    end: number;
  };
};

type LanyardData = {
  discord_status: "online" | "idle" | "dnd" | "offline";
  discord_user: {
    username: string;
    avatar: string;
    id: string;
    display_name?: string;
    discriminator?: string;
  };
  activities: DiscordActivity[];
  listening_to_spotify: boolean;
  spotify?: LanyardSpotify | null;
};

function getAssetUrl(applicationId?: string, assetId?: string): string | null {
  if (!assetId) return null;
  if (assetId.startsWith("http://") || assetId.startsWith("https://")) {
    return assetId;
  }
  if (assetId.startsWith("mp:external/")) {
    return `https://media.discordapp.net/external/${assetId.replace(/^mp:external\//, "")}`;
  }
  if (assetId.startsWith("mp:")) {
    return `https://media.discordapp.net/${assetId.replace(/^mp:/, "")}`;
  }
  if (assetId.startsWith("spotify:")) {
    return `https://i.scdn.co/image/${assetId.slice(8)}`;
  }
  if (applicationId) {
    return `https://cdn.discordapp.com/app-assets/${applicationId}/${assetId}.png`;
  }
  return null;
}

function formatDuration(ms: number): string {
  if (!ms || ms < 0) ms = 0;
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export default function DiscordCard({ userId }: { userId: string }) {
  const [data, setData] = useState<LanyardData | null>(null);
  const [now, setNow] = useState<number>(Date.now());
  const { lang } = useLanguage();

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let ws: WebSocket;
    let heartbeatInterval: NodeJS.Timeout;
    let isSubscribed = true;

    fetch(`https://api.lanyard.rest/v1/users/${userId}`)
      .then((res) => res.json())
      .then((json) => {
        if (isSubscribed && json.success && json.data) {
          setData(json.data);
        }
      })
      .catch(() => {});

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
        try {
          const msg = JSON.parse(event.data);
          if (msg.op === 1) {
            heartbeatInterval = setInterval(() => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ op: 3 }));
              }
            }, msg.d.heartbeat_interval);
          }
          if (msg.t === "INIT_STATE" || msg.t === "PRESENCE_UPDATE") {
            setData(msg.d);
          }
        } catch {
        }
      };

      ws.onclose = () => {
        clearInterval(heartbeatInterval);
        setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      isSubscribed = false;
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
      ? lang === "fr" ? "Ne pas déranger" : "Do Not Disturb"
      : lang === "fr" ? "Hors ligne" : "Offline";

  const avatarUrl = data.discord_user?.avatar
    ? `https://cdn.discordapp.com/avatars/${data.discord_user.id}/${data.discord_user.avatar}.webp?size=128`
    : null;

  const displayName = data.discord_user?.display_name || data.discord_user?.username || "NeXoS_20";

  const activities = data.activities || [];

  const customStatus = activities.find(
    (a) => a.type === 4 || a.id === "custom"
  );

  let spotifyData: LanyardSpotify | null = null;
  if (data.listening_to_spotify && data.spotify) {
    spotifyData = data.spotify;
  } else {
    const spotifyActivity = activities.find(
      (a) => a.name.toLowerCase() === "spotify" || a.id === "spotify:1" || a.type === 2
    );
    if (spotifyActivity) {
      spotifyData = {
        song: spotifyActivity.details || spotifyActivity.name,
        artist: spotifyActivity.state || "Spotify",
        album: spotifyActivity.assets?.large_text || "",
        album_art_url: getAssetUrl(spotifyActivity.application_id, spotifyActivity.assets?.large_image) || "",
        timestamps: spotifyActivity.timestamps as any,
      };
    }
  }

  const otherActivities = activities.filter((a) => {
    if (a.type === 4 || a.id === "custom") return false;
    if (a.name.toLowerCase() === "spotify" || a.id === "spotify:1" || (a.type === 2 && a.name.toLowerCase() === "spotify")) {
      return false;
    }
    return true;
  });

  const hasAnyActivity = spotifyData !== null || otherActivities.length > 0;

  return (
    <div
      className="w-full max-w-sm rounded-xl bg-ink-1/85 border border-ice-700/30 backdrop-blur-md overflow-hidden pointer-events-auto shadow-2xl shadow-black/40 fade-in-up"
      style={{ ["--d" as string]: "800ms" }}
    >
      <div className="px-4 pt-4 pb-3 flex items-center gap-3">
        <div className="relative flex-shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-11 h-11 rounded-full ring-2 ring-ice-700/40 object-cover"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-ice-600 ring-2 ring-ice-700/40 flex items-center justify-center text-white font-bold text-base">
              N
            </div>
          )}
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-ink-1 ${statusColor} ${statusGlow}`}
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ice-100 truncate">{displayName}</p>
          <p className="text-[11px] text-ice-400 font-medium">{statusLabel}</p>

          {customStatus && (customStatus.state || customStatus.emoji) && (
            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-ice-300 truncate">
              {customStatus.emoji?.id ? (
                <img
                  src={`https://cdn.discordapp.com/emojis/${customStatus.emoji.id}.${customStatus.emoji.animated ? "gif" : "webp"}?size=24`}
                  alt={customStatus.emoji.name}
                  className="w-3.5 h-3.5 object-contain inline-block flex-shrink-0"
                />
              ) : customStatus.emoji?.name ? (
                <span className="text-xs">{customStatus.emoji.name}</span>
              ) : null}
              {customStatus.state && (
                <span className="truncate">{customStatus.state}</span>
              )}
            </div>
          )}
        </div>

        <div className="flex-shrink-0 text-ice-500/60 hover:text-ice-400 transition-colors" title="Discord">
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden>
            <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z" />
          </svg>
        </div>
      </div>

      <div className="h-px bg-ice-700/20 mx-3" />

      <div className="px-4 py-3 space-y-3.5">
        {otherActivities.map((act, index) => {
          const isCode =
            act.name === "Visual Studio Code" ||
            act.name === "Code" ||
            act.application_id === "782685898163617802";

          const largeImg = getAssetUrl(act.application_id, act.assets?.large_image);
          const smallImg = getAssetUrl(act.application_id, act.assets?.small_image);

          let headerLabel =
            act.type === 0
              ? `${lang === "fr" ? "Joue à" : "Playing"} ${act.name}`
              : act.type === 1
              ? `${lang === "fr" ? "En stream sur" : "Streaming on"} ${act.name}`
              : act.type === 2
              ? `${lang === "fr" ? "Écoute" : "Listening to"} ${act.name}`
              : act.type === 3
              ? `${lang === "fr" ? "Regarde" : "Watching"} ${act.name}`
              : act.type === 5
              ? `${lang === "fr" ? "En compétition dans" : "Competing in"} ${act.name}`
              : act.name;

          if (isCode) {
            headerLabel = lang === "fr" ? "Joue à Code" : "Playing Code";
          }

          const elapsed = act.timestamps?.start ? Math.max(0, now - act.timestamps.start) : null;

          return (
            <div key={act.id || index} className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-ice-400 flex items-center gap-1.5">
                {isCode ? (
                  <span className="inline-block w-2 h-2 rounded-full bg-[#007acc]" />
                ) : (
                  <span className="inline-block w-2 h-2 rounded-full bg-cyan-400" />
                )}
                {headerLabel}
              </p>

              <div className="flex items-start gap-3">
                <div className="relative flex-shrink-0">
                  {largeImg ? (
                    <img
                      src={largeImg}
                      alt={act.assets?.large_text || act.name}
                      className="w-12 h-12 rounded-lg bg-ink-2/90 border border-ice-700/30 object-cover"
                    />
                  ) : isCode ? (
                    <div className="w-12 h-12 rounded-lg bg-[#1e1e2e] border border-ice-700/30 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#007acc]" fill="currentColor">
                        <path d="M23.15 2.587L18.21.21a1.494 1.494 0 00-1.705.29l-9.46 8.63-4.12-3.128a.999.999 0 00-1.276.057L.327 7.261A1 1 0 00.326 8.74L3.899 12 .326 15.26a1 1 0 00.001 1.479L1.65 17.94a.999.999 0 001.276.057l4.12-3.128 9.46 8.63a1.492 1.492 0 001.704.29l4.942-2.377A1.5 1.5 0 0024 20.06V3.939a1.5 1.5 0 00-.85-1.352zm-5.146 14.861L10.826 12l7.178-5.448v10.896z" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-ink-2/90 border border-ice-700/30 flex items-center justify-center text-ice-400">
                      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="6" width="20" height="12" rx="3" />
                        <path d="M6 12h4m-2-2v4m7-2h.01m3 0h.01" />
                      </svg>
                    </div>
                  )}

                  {smallImg && (
                    <img
                      src={smallImg}
                      alt={act.assets?.small_text || "Badge"}
                      className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-ink-1 ring-2 ring-ink-1 object-cover"
                      title={act.assets?.small_text}
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-ice-100 truncate">{act.name}</p>
                  {act.details && (
                    <p className="text-[11px] text-ice-300 truncate font-normal leading-tight mt-0.5">
                      {act.details}
                    </p>
                  )}
                  {act.state && (
                    <p className="text-[11px] text-ice-400 truncate leading-tight mt-0.5">
                      {act.state}
                    </p>
                  )}
                  {elapsed !== null && (
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-emerald-400/90 font-mono">
                      <span>🎮</span>
                      <span>{formatDuration(elapsed)}</span>
                    </div>
                  )}
                </div>
              </div>

              {index < otherActivities.length - 1 && (
                <div className="h-px bg-ice-700/15 pt-2" />
              )}
            </div>
          );
        })}

        {otherActivities.length > 0 && spotifyData && (
          <div className="h-px bg-ice-700/20" />
        )}

        {spotifyData && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-semibold text-emerald-400">
              <span className="flex items-center gap-1.5">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" aria-hidden>
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.1-10.561-1.14-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.56 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.3c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                </svg>
                {lang === "fr" ? "Écoute Spotify" : "Listening to Spotify"}
              </span>
            </div>

            <div className="flex items-start gap-3">
              {spotifyData.album_art_url ? (
                <img
                  src={spotifyData.album_art_url}
                  alt={spotifyData.album || spotifyData.song}
                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-ice-700/30 shadow-md shadow-emerald-950/20"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
                  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.1-10.561-1.14-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.56 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.3c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                  </svg>
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-ice-100 truncate leading-snug">
                  {spotifyData.song}
                </p>
                <p className="text-[11px] text-ice-300 truncate leading-snug mt-0.5">
                  {spotifyData.artist}
                </p>
                {spotifyData.album && (
                  <p className="text-[10px] text-ice-400/80 truncate leading-tight mt-0.5">
                    {spotifyData.album}
                  </p>
                )}
              </div>
            </div>

            {spotifyData.timestamps?.start && spotifyData.timestamps?.end && (() => {
              const start = spotifyData.timestamps.start;
              const end = spotifyData.timestamps.end;
              const total = Math.max(1, end - start);
              const elapsed = Math.max(0, Math.min(total, now - start));
              const percent = Math.min(100, Math.max(0, (elapsed / total) * 100));

              return (
                <div className="pt-1">
                  <div className="w-full h-1 bg-ice-700/30 rounded-full overflow-hidden relative">
                    <div
                      className="h-full bg-emerald-400 rounded-full transition-all duration-300 ease-linear"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-ice-400 font-mono mt-1">
                    <span>{formatDuration(elapsed)}</span>
                    <span>{formatDuration(total)}</span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {!hasAnyActivity && data.discord_status !== "offline" && (
          <p className="text-[11px] text-ice-400 italic py-1">
            {lang === "fr" ? "Aucune activité en cours" : "No current activity"}
          </p>
        )}
      </div>
    </div>
  );
}
