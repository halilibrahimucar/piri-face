// Face Detection utility using MediaPipe
import { FaceDetection } from '@mediapipe/face_detection';
import { Camera } from '@mediapipe/camera_utils';

export interface FaceAnalysis {
  detected: boolean;
  age?: number;
  gender?: 'male' | 'female' | 'unknown';
  emotion?: 'happy' | 'sad' | 'neutral' | 'angry' | 'surprised' | 'unknown';
  confidence?: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export class FaceDetector {
  private faceDetection: FaceDetection | null = null;
  private camera: Camera | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private onDetectionCallback: ((analysis: FaceAnalysis) => void) | null = null;
  private isInitialized = false;

  async initialize(videoElement: HTMLVideoElement, onDetection: (analysis: FaceAnalysis) => void) {
    this.videoElement = videoElement;
    this.onDetectionCallback = onDetection;

    try {
      this.faceDetection = new FaceDetection({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`;
        }
      });

      this.faceDetection.setOptions({
        modelSelection: 1, // 0 for short-range, 1 for full-range
        minDetectionConfidence: 0.5
      });

      this.faceDetection.onResults((results) => {
        this.processResults(results);
      });

      // Start camera
      if (this.videoElement) {
        this.camera = new Camera(this.videoElement, {
          onFrame: async () => {
            if (this.faceDetection) {
              await this.faceDetection.send({ image: this.videoElement! });
            }
          },
          width: 640,
          height: 480
        });
        await this.camera.start();
      }

      this.isInitialized = true;
      console.log('Face detection initialized');
    } catch (error) {
      console.error('Error initializing face detection:', error);
      throw error;
    }
  }

  private processResults(results: any) {
    if (!this.onDetectionCallback) return;

    if (results.detections && results.detections.length > 0) {
      const detection = results.detections[0];
      const boundingBox = detection.boundingBox;

      // Basit analiz (MediaPipe sadece yüz tespiti yapar, yaş/cinsiyet için ek model gerekir)
      const analysis: FaceAnalysis = {
        detected: true,
        confidence: detection.score || 0,
        boundingBox: {
          x: boundingBox.xCenter * (this.videoElement?.videoWidth || 640) - (boundingBox.width * (this.videoElement?.videoWidth || 640)) / 2,
          y: boundingBox.yCenter * (this.videoElement?.videoHeight || 480) - (boundingBox.height * (this.videoElement?.videoHeight || 480)) / 2,
          width: boundingBox.width * (this.videoElement?.videoWidth || 640),
          height: boundingBox.height * (this.videoElement?.videoHeight || 480)
        },
        // Bu bilgiler için ek model gerekir (ör: AgeNet, GenderNet)
        // Şimdilik basit tahminler yapabiliriz
        age: this.estimateAge(detection),
        gender: this.estimateGender(detection),
        emotion: this.estimateEmotion(detection)
      };

      this.onDetectionCallback(analysis);
    } else {
      this.onDetectionCallback({
        detected: false
      });
    }
  }

  // Basit tahmin fonksiyonları (gerçek uygulamada ML modelleri kullanılmalı)
  private estimateAge(detection: any): number | undefined {
    // MediaPipe yaş tahmini yapmaz, bu yüzden undefined döner
    // Gerçek uygulamada AgeNet veya benzeri model kullanılmalı
    return undefined;
  }

  private estimateGender(detection: any): 'male' | 'female' | 'unknown' {
    // MediaPipe cinsiyet tahmini yapmaz
    // Gerçek uygulamada GenderNet veya benzeri model kullanılmalı
    return 'unknown';
  }

  private estimateEmotion(detection: any): 'happy' | 'sad' | 'neutral' | 'angry' | 'surprised' | 'unknown' {
    // MediaPipe duygu tahmini yapmaz
    // Gerçek uygulamada emotion recognition modeli kullanılmalı
    return 'neutral';
  }

  async stop() {
    if (this.camera) {
      this.camera.stop();
      this.camera = null;
    }
    if (this.faceDetection) {
      this.faceDetection.close();
      this.faceDetection = null;
    }
    this.isInitialized = false;
    console.log('Face detection stopped');
  }

  isReady(): boolean {
    return this.isInitialized;
  }
}

