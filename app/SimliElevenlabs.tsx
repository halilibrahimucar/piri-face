"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useConversation } from "./simli-elevenlabs/elevenlabs-react";
import VideoBox from "./Components/VideoBox";
import DottedFace from "./Components/DottedFace";
import RingtoneAudio from "./Components/RingtoneAudio";
import cn from "./utils/TailwindMergeAndClsx";
import IconSparkleLoader from "@/media/IconSparkleLoader";
import IconFaceTime from "@/media/IconFaceTime";
import { getElevenLabsSignedUrl } from "./actions/actions";

// SimliClient'ı dinamik olarak yüklüyoruz
let SimliClient: any = null;

interface SimliElevenlabsProps {
  simli_faceid: string;
  agentId: string;
}

const SimliElevenlabs: React.FC<SimliElevenlabsProps> = ({
  simli_faceid,
  agentId,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isAvatarVisible, setIsAvatarVisible] = useState(false);
  const [error, setError] = useState("");
  const [isRinging, setIsRinging] = useState(false);
  const [isSimliClientLoaded, setIsSimliClientLoaded] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const simliClientRef = useRef<any>(null);

  // SimliClient'ı önceden yükle
  useEffect(() => {
    if (typeof window !== 'undefined' && !SimliClient) {
      import('simli-client')
        .then((module) => {
          SimliClient = module.SimliClient;
          setIsSimliClientLoaded(true);
          console.log("SimliClient loaded successfully");
        })
        .catch(err => {
          console.error("Failed to load SimliClient:", err);
          setError("SimliClient yüklenemedi. Lütfen sayfayı yenileyin.");
        });
    } else if (SimliClient) {
      setIsSimliClientLoaded(true);
    }
  }, []);

  const conversation = useConversation({
    onConnect: () => {
      console.log("ElevenLabs conversation connected");
      setIsAvatarVisible(true);
      setIsRinging(false);
      setIsLoading(false);
    },

    onDisconnect: () => {
      console.log("ElevenLabs conversation disconnected");
      setIsAvatarVisible(false);
      setIsRinging(false);
      simliClientRef.current?.ClearBuffer();
      simliClientRef.current?.close();
    },

    onMessage: (message) => {
      console.log("ElevenLabs conversation message:", message);
    },

    onModeChange(data) {
      console.log("ElevenLabs conversation mode change:", data);
      if (data.mode === "interrupted") {
        simliClientRef.current?.ClearBuffer();
      }
    },

    onError: (error) => {
      console.error("ElevenLabs conversation error:", error);
      setError(`Görüşme hatası: ${error}`);
      setIsLoading(false);
      setIsRinging(false);
    },

    onAudioData: (audioData: Uint8Array) => {
      if (simliClientRef.current) {
        simliClientRef.current.sendAudioData(audioData);
      }
    },
  });

  const initializeSimliClient = useCallback(async () => {
    try {
      if (!videoRef.current || !audioRef.current) {
        throw new Error("Video veya ses referansları bulunamadı");
      }

      const apiKey = process.env.NEXT_PUBLIC_SIMLI_API_KEY;
      if (!apiKey) {
        throw new Error("Simli API anahtarı bulunamadı. Lütfen .env dosyasını kontrol edin.");
      }

      if (!SimliClient) {
        throw new Error("SimliClient henüz yüklenmedi");
      }

      const SimliConfig = {
        apiKey,
        faceID: simli_faceid,
        handleSilence: true,
        videoRef: videoRef.current,
        audioRef: audioRef.current,
        syncAudio: true,
        isJPG: false
      };

      if (!simliClientRef.current) {
        simliClientRef.current = new SimliClient();
      }
      
      if (simliClientRef.current) {
        await simliClientRef.current.Initialize(SimliConfig);
        console.log("Simli Client initialized");
      } else {
        throw new Error("SimliClient yüklenemedi");
      }

    } catch (error) {
      console.error("SimliClient initialization error:", error);
      throw error;
    }
  }, [simli_faceid]);

  const startElevenLabsConversation = async () => {
    try {
      console.log("Starting ElevenLabs conversation with agent ID:", agentId);
      
      // Yeni API'de signed URL zorunlu
      const res = await getElevenLabsSignedUrl(agentId);
      
      if (!res) {
        throw new Error("ElevenLabs API yanıt vermedi");
      }
      
      if ("error" in res) {
        throw new Error(`ElevenLabs signed URL alınamadı: ${res.error}`);
      }
      
      if (!("signed_url" in res) || !res.signed_url) {
        throw new Error("ElevenLabs signed URL alınamadı: Geçersiz yanıt");
      }
      
      console.log("Got ElevenLabs signed URL, starting conversation...");
      conversation.setVolume({ volume: 0 });
      
      await conversation.startSession({
        agentId: agentId,
        signedUrl: res.signed_url,
      });
      
      console.log("ElevenLabs conversation started successfully");
    } catch (error: any) {
      console.error("ElevenLabs conversation error:", error);
      const errorMessage = error?.message || "Bilinmeyen hata";
      setError(`ElevenLabs bağlantı hatası: ${errorMessage}`);
      setIsLoading(false);
      setIsRinging(false);
      throw error; // Hata durumunda üst seviyeye fırlat
    }
  };

  const handleStart = useCallback(async () => {
    try {
      if (!SimliClient) {
        setError("SimliClient henüz yüklenmedi. Lütfen bekleyin.");
        return;
      }

      setIsLoading(true);
      setIsRinging(true);
      setError("");

      // Önce mikrofon izni al
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // SimliClient'ı başlat
      await initializeSimliClient();

      if (!simliClientRef.current) {
        throw new Error("SimliClient başlatılamadı");
      }

      // Event listener'ları ekle
      simliClientRef.current.on("connected", async () => {
        console.log("SimliClient connected");
        try {
          const audioData = new Uint8Array(6000).fill(0);
          simliClientRef.current?.sendAudioData(audioData);
          console.log("Sent initial audio data");

          await startElevenLabsConversation();
        } catch (error: any) {
          console.error("Error starting ElevenLabs conversation:", error);
          setError(`ElevenLabs bağlantı hatası: ${error.message}`);
          setIsLoading(false);
          setIsRinging(false);
          setIsAvatarVisible(false);
        }
      });

      simliClientRef.current.on("disconnected", () => {
        console.log("SimliClient disconnected");
        setIsAvatarVisible(false);
        setIsRinging(false);
      });

      simliClientRef.current.on("error", (error: Error) => {
        console.error("SimliClient error:", error);
        setError(`Simli hatası: ${error.message}`);
        setIsLoading(false);
        setIsRinging(false);
        setIsAvatarVisible(false);
      });

      // SimliClient'ı başlat
      await simliClientRef.current.start();

    } catch (error: any) {
      console.error("Error starting interaction:", error);
      setError(`Etkileşim başlatılamadı: ${error.message}`);
      setIsLoading(false);
      setIsRinging(false);
      setIsAvatarVisible(false);
    }
  }, [agentId, conversation, initializeSimliClient]);

  const handleStop = useCallback(() => {
    console.log("Stopping interaction...");
    setIsLoading(false);
    setError("");
    setIsAvatarVisible(false);
    setIsRinging(false);

    conversation.endSession();
    simliClientRef.current?.close();
    simliClientRef.current = null;
  }, [conversation]);

  return (
    <div className="relative w-full h-full">
      {error && (
        <div className="absolute top-4 left-0 right-0 z-30 px-4">
          <div className="bg-red-500 text-white p-4 rounded-lg text-center">
            {error}
          </div>
        </div>
      )}

      <RingtoneAudio isPlaying={isRinging} />

      {/* DottedFace her zaman arka planda görünür */}
      <div className={cn(
        "absolute inset-0 z-0 transition-opacity duration-300",
        isAvatarVisible ? "opacity-0" : "opacity-100"
      )}>
        <DottedFace />
      </div>

      {/* Video görüntüsü */}
      <div className={cn(
        "absolute inset-0 z-10 transition-opacity duration-300",
        isAvatarVisible ? "opacity-100" : "opacity-0"
      )}>
        <VideoBox video={videoRef} audio={audioRef} />
      </div>
      
      {/* Kontrol butonları */}
      <div className="fixed bottom-8 left-0 right-0 z-20 px-4">
        <div className="flex justify-center">
          {!isAvatarVisible ? (
            <button
              onClick={handleStart}
              disabled={isLoading || !isSimliClientLoaded}
              className={cn(
                "w-16 h-16 disabled:bg-[#343434] disabled:text-white bg-green-500 text-white rounded-full transition-all duration-300 hover:bg-green-600",
                "flex justify-center items-center"
              )}
            >
              {isLoading ? (
                <IconSparkleLoader className="h-[20px] animate-loader" />
              ) : (
                <IconFaceTime className="w-8 h-8" />
              )}
            </button>
          ) : (
            <button
              onClick={handleStop}
              className={cn(
                "w-16 h-16 bg-red-500 text-white rounded-full transition-all duration-300 hover:bg-red-600",
                "flex justify-center items-center"
              )}
            >
              <IconFaceTime className="w-8 h-8 rotate-180" />
            </button>
          )}
        </div>
      </div>
      
      {/* Yükleme durumu göstergesi */}
      {!isSimliClientLoaded && !isLoading && !isAvatarVisible && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black bg-opacity-50">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
            <p>SimliClient yükleniyor...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimliElevenlabs;