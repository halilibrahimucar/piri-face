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
import { FaceAnalyzer, FaceAnalysisResult } from "./utils/faceAnalysis";

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
  const userCameraRef = useRef<HTMLVideoElement>(null);
  const userCameraPreviewRef = useRef<HTMLVideoElement>(null);
  const userCameraStreamRef = useRef<MediaStream | null>(null);
  const faceAnalyzerRef = useRef<FaceAnalyzer | null>(null);
  const [faceAnalysis, setFaceAnalysis] = useState<FaceAnalysisResult | null>(null);
  const [isUserCameraActive, setIsUserCameraActive] = useState(false);

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

  // Start face analysis function (defined after conversation to avoid circular dependency)
  const startFaceAnalysisRef = useRef<(() => void) | null>(null);

  const conversation = useConversation({
    onConnect: () => {
      console.log("ElevenLabs conversation connected");
      setIsAvatarVisible(true);
      setIsRinging(false);
      setIsLoading(false);
      
      // Start face analysis when connected (with delay to ensure camera is ready)
      // Kameranın hazır olduğundan emin ol
      const checkCameraAndStartAnalysis = () => {
        if (userCameraRef.current && userCameraRef.current.videoWidth > 0) {
          startFaceAnalysisRef.current?.();
        } else {
          console.log("Kamera henüz hazır değil, bekleniyor...");
          setTimeout(checkCameraAndStartAnalysis, 500);
        }
      };
      setTimeout(checkCameraAndStartAnalysis, 1000);
    },

    onDisconnect: () => {
      console.log("ElevenLabs conversation disconnected");
      setIsAvatarVisible(false);
      setIsRinging(false);
      simliClientRef.current?.ClearBuffer();
      simliClientRef.current?.close();
      
      // Stop face analysis when disconnected
      stopFaceAnalysis();
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

  // Start face analysis (defined after conversation)
  const startFaceAnalysis = useCallback(async () => {
    try {
      // Wait for camera to be ready
      if (!userCameraRef.current || !userCameraRef.current.videoWidth) {
        console.log("Waiting for camera to be ready...");
        setTimeout(() => startFaceAnalysis(), 500);
        return;
      }

      if (!faceAnalyzerRef.current) {
        // Initialize face analyzer
        faceAnalyzerRef.current = new FaceAnalyzer();
        await faceAnalyzerRef.current.loadModels();
      }

      let firstDetection = true; // İlk tespit için özel mesaj
      let lastContextSent = ''; // Son gönderilen context'i takip et

      if (userCameraRef.current && faceAnalyzerRef.current) {
        await faceAnalyzerRef.current.startAnalysis(
          userCameraRef.current,
          (result: FaceAnalysisResult) => {
            setFaceAnalysis(result);
            
            // Send context to ElevenLabs agent
            if (result.detected) {
              const contextKey = `${result.age}-${result.gender}-${result.emotion}`;
              
              // Context değiştiyse veya ilk tespitse gönder
              if (firstDetection || lastContextSent !== contextKey) {
                lastContextSent = contextKey;
                
                // Context'i agent'a gönder
                conversation.sendContext({
                  userInfo: {
                    detected: true,
                    age: result.age,
                    gender: result.gender,
                    emotion: result.emotion
                  },
                  customData: {
                    expressions: result.expressions,
                    confidence: result.confidence,
                    firstDetection: firstDetection
                  }
                });

                // İlk tespitte agent'a bilgi ver (sessizce - sistem mesajı olarak)
                if (firstDetection) {
                  firstDetection = false;
                  console.log("👤 Yüz tespit edildi - Agent'a bildiriliyor...");
                  
                  // Agent'a context'i kullanması için bilgi ver
                  // Not: Bu bilgi agent'ın prompt'unda olmalı
                  // Şimdilik sadece log'layalım
                }
              }
            } else {
              // Yüz tespit edilmediyse, firstDetection'i sıfırla
              if (!firstDetection) {
                firstDetection = true;
                lastContextSent = '';
              }
            }
          },
          2000 // Analyze every 2 seconds
        );
        console.log("Face analysis started");
      }
    } catch (error) {
      console.error("Error starting face analysis:", error);
      // Face analysis is optional, don't throw error
    }
  }, [conversation]);

  // Update ref when startFaceAnalysis changes
  useEffect(() => {
    startFaceAnalysisRef.current = startFaceAnalysis;
  }, [startFaceAnalysis]);


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

  // Start user camera for face analysis and preview
  // Not: Kamera artık handleStart içinde başlatılıyor
  const startUserCamera = useCallback(async () => {
    // Bu fonksiyon artık kullanılmıyor, kamera handleStart'ta başlatılıyor
    console.log("startUserCamera called - but camera is already started in handleStart");
  }, []);

  // Stop user camera
  const stopUserCamera = useCallback(() => {
    // Preview video stream'ini kapat
    if (userCameraPreviewRef.current) {
      userCameraPreviewRef.current.srcObject = null;
    }
    
    // Ana stream'i kapat
    if (userCameraStreamRef.current) {
      userCameraStreamRef.current.getTracks().forEach(track => track.stop());
      userCameraStreamRef.current = null;
    }
    
    if (userCameraRef.current) {
      userCameraRef.current.srcObject = null;
    }
    
    setIsUserCameraActive(false);
    console.log("User camera stopped");
  }, []);


  // Stop face analysis
  const stopFaceAnalysis = useCallback(() => {
    if (faceAnalyzerRef.current) {
      faceAnalyzerRef.current.stopAnalysis();
      faceAnalyzerRef.current = null;
      console.log("Face analysis stopped");
    }
    stopUserCamera();
  }, [stopUserCamera]);

  const handleStart = useCallback(async () => {
    try {
      if (!SimliClient) {
        setError("SimliClient henüz yüklenmedi. Lütfen bekleyin.");
        return;
      }

      setIsLoading(true);
      setIsRinging(true);
      setError("");

      // Önce mikrofon ve kamera izni birlikte al
      console.log("📹 Kamera ve mikrofon izni isteniyor...");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: true,
          video: { 
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            facingMode: 'user',
            aspectRatio: { ideal: 16/9 }
          }
        });
        console.log("✅ Kamera ve mikrofon izni alındı");
        
        // Video ve audio stream'lerini ayır
        const videoTracks = stream.getVideoTracks();
        const audioTracks = stream.getAudioTracks();
        
        // Kullanıcı kamerayı başlat (sadece video) - önce tam ekran göster
        if (userCameraRef.current && videoTracks.length > 0) {
          const videoStream = new MediaStream(videoTracks);
          
          // Stream'i ref'te sakla (preview için gerekli)
          userCameraStreamRef.current = videoStream;
          
          // Ana video elementi (tam ekran)
          userCameraRef.current.srcObject = videoStream;
          
          // Video yüklendiğinde oynat
          const playVideo = async () => {
            try {
              if (userCameraRef.current) {
                await userCameraRef.current.play();
                setIsUserCameraActive(true);
                console.log("✅ Kullanıcı kamerası aktif - tam ekran görüntü gösteriliyor");
              }
            } catch (playError) {
              console.error("Video play hatası:", playError);
            }
          };
          
          userCameraRef.current.onloadedmetadata = playVideo;
          
          // Eğer metadata zaten yüklendiyse
          if (userCameraRef.current.readyState >= 2) {
            await playVideo();
          }
        } else {
          console.warn("⚠️ Video track bulunamadı");
        }
        
        // Audio stream'i kapat (SimliClient kendi audio stream'ini kullanacak)
        audioTracks.forEach(track => {
          track.stop();
          stream.removeTrack(track);
        });
      } catch (error: any) {
        console.error("Kamera/mikrofon izni hatası:", error);
        throw new Error(`Kamera erişimi başarısız: ${error.message}. Lütfen kamera iznini kontrol edin.`);
      }
      
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
      stopFaceAnalysis();
      stopUserCamera();
    }
  }, [agentId, conversation, initializeSimliClient, stopFaceAnalysis, stopUserCamera]);

  const handleStop = useCallback(() => {
    console.log("Stopping interaction...");
    setIsLoading(false);
    setError("");
    setIsAvatarVisible(false);
    setIsRinging(false);

    conversation.endSession();
    simliClientRef.current?.close();
    simliClientRef.current = null;
    stopFaceAnalysis();
  }, [conversation, stopFaceAnalysis]);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-40 px-4 max-w-md">
          <div className="bg-red-500 text-white p-4 rounded-lg text-center shadow-2xl backdrop-blur-sm">
            {error}
          </div>
        </div>
      )}

      <RingtoneAudio isPlaying={isRinging} />

      {/* DottedFace - sadece kamera aktif değilse görünür */}
      <div className={cn(
        "absolute inset-0 z-0 transition-opacity duration-300",
        (!isAvatarVisible && !isUserCameraActive) ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        <DottedFace />
      </div>

      {/* Kullanıcı kamerası - Tam ekran (sohbete başlamadan önce) - Avatar gibi */}
      {!isAvatarVisible && (
        <div className={cn(
          "fixed inset-0 z-10 bg-black transition-opacity duration-500",
          isUserCameraActive ? "opacity-100" : "opacity-0 pointer-events-none"
        )}>
          <video
            ref={userCameraRef}
            className="w-full h-full object-cover scale-x-[-1]"
            autoPlay
            playsInline
            muted
          />
        </div>
      )}

      {/* Avatar video görüntüsü - Ana ekran (bağlantı kurulduğunda) */}
      <div className={cn(
        "fixed inset-0 z-10 bg-black transition-opacity duration-500",
        isAvatarVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        <VideoBox video={videoRef} audio={audioRef} />
      </div>

      {/* User camera preview - FaceTime style (sağ alt, avatar görünürken) */}
      {isAvatarVisible && isUserCameraActive && (
        <div 
          className="fixed z-[100] rounded-2xl overflow-hidden shadow-2xl border-2 border-white/30 bg-black/50 backdrop-blur-sm"
          style={{
            bottom: '112px', // Butonların üstünde (bottom-6 = 24px, buton yüksekliği 64px + gap)
            right: '16px',   // right-4 = 16px
            width: 'clamp(128px, 20vw, 176px)',  // Responsive: w-32 (128px) to md:w-44 (176px)
            height: 'clamp(160px, 25vw, 220px)', // Responsive: h-40 (160px) to md:h-55 (220px)
            maxWidth: '176px',
            maxHeight: '220px',
          }}
        >
          <video
            ref={(el) => {
              // Ref'i güncelle
              if (userCameraPreviewRef) {
                (userCameraPreviewRef as any).current = el;
              }
              
              // Stream'i hemen bağla (eğer henüz bağlanmadıysa)
              if (el && userCameraStreamRef.current && !el.srcObject) {
                const stream = userCameraStreamRef.current;
                const videoTracks = stream.getVideoTracks();
                if (videoTracks.length > 0) {
                  // Yeni bir MediaStream oluştur (aynı track'leri kullan)
                  const previewStream = new MediaStream(videoTracks);
                  el.srcObject = previewStream;
                  
                  // Video oynat
                  el.play()
                    .then(() => {
                      console.log("✅ Preview video'ya stream bağlandı ve oynatılıyor");
                    })
                    .catch((err) => {
                      console.error("Preview video play error:", err);
                      // Retry after element is ready
                      setTimeout(() => {
                        if (el && el.srcObject) {
                          el.play().catch(console.error);
                        }
                      }, 300);
                    });
                }
              }
            }}
            className="w-full h-full object-cover scale-x-[-1]"
            autoPlay
            playsInline
            muted
          />
          {/* User camera overlay with face analysis info */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none">
            {faceAnalysis?.detected && (
              <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
                  <span className="font-semibold text-sm">Aktif</span>
                </div>
                {process.env.NODE_ENV === 'development' && (
                  <div className="text-[10px] opacity-80 space-y-0.5">
                    <div>👤 {faceAnalysis.age} yaş</div>
                    <div>😊 {faceAnalysis.emotion}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Face analysis info (debug - top left, smaller) */}
      {faceAnalysis?.detected && process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 left-4 z-30 bg-black bg-opacity-70 text-white p-2 rounded-lg text-xs backdrop-blur-sm">
          <div className="font-semibold mb-1">Yüz Analizi</div>
          <div>Yaş: {faceAnalysis.age}</div>
          <div>Cinsiyet: {faceAnalysis.gender}</div>
          <div>Duygu: {faceAnalysis.emotion}</div>
          <div>Güven: {((faceAnalysis.confidence || 0) * 100).toFixed(0)}%</div>
        </div>
      )}
      
      {/* Kontrol butonları - FaceTime style */}
      <div className="fixed bottom-6 left-0 right-0 z-20 px-4">
        <div className="flex justify-center items-center gap-4">
          {!isAvatarVisible ? (
            <button
              onClick={handleStart}
              disabled={isLoading || !isSimliClientLoaded}
              className={cn(
                "w-16 h-16 disabled:bg-[#343434] disabled:text-white/50 bg-green-500 text-white rounded-full transition-all duration-300 hover:bg-green-600 hover:scale-110",
                "flex justify-center items-center shadow-2xl border-4 border-white/20",
                "disabled:cursor-not-allowed"
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
                "w-16 h-16 bg-red-500 text-white rounded-full transition-all duration-300 hover:bg-red-600 hover:scale-110",
                "flex justify-center items-center shadow-2xl border-4 border-white/20"
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