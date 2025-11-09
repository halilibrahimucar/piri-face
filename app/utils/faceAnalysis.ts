// Advanced Face Analysis using face-api.js
import * as faceapi from 'face-api.js';

export interface FaceAnalysisResult {
  detected: boolean;
  age?: number;
  gender?: 'male' | 'female' | 'unknown';
  emotion?: 'happy' | 'sad' | 'neutral' | 'angry' | 'surprised' | 'fearful' | 'disgusted' | 'unknown';
  expressions?: {
    happy: number;
    sad: number;
    angry: number;
    fearful: number;
    disgusted: number;
    surprised: number;
    neutral: number;
  };
  confidence?: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export class FaceAnalyzer {
  private modelsLoaded = false;
  private videoElement: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private isAnalyzing = false;
  private analysisInterval: number | null = null;

  async loadModels() {
    if (this.modelsLoaded) return;

    try {
      // Try loading from CDN first (more reliable)
      const CDN_URL = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(CDN_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(CDN_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(CDN_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(CDN_URL),
        faceapi.nets.ageGenderNet.loadFromUri(CDN_URL)
      ]);
      this.modelsLoaded = true;
      console.log('Face detection models loaded from CDN');
    } catch (cdnError) {
      console.error('Error loading models from CDN, trying local:', cdnError);
      // Fallback: Try loading from local public/models
      try {
        const MODEL_URL = '/models';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
          faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL)
        ]);
        this.modelsLoaded = true;
        console.log('Face detection models loaded from local');
      } catch (error) {
        console.error('Error loading face detection models:', error);
        throw new Error('Failed to load face detection models. Please check your internet connection.');
      }
    }
  }

  async startAnalysis(
    videoElement: HTMLVideoElement,
    onAnalysis: (result: FaceAnalysisResult) => void,
    interval: number = 1000 // Analyze every 1 second
  ) {
    if (!this.modelsLoaded) {
      await this.loadModels();
    }

    this.videoElement = videoElement;
    this.isAnalyzing = true;

    // Create canvas for analysis
    this.canvas = document.createElement('canvas');

    const analyze = async () => {
      if (!this.isAnalyzing || !this.videoElement || !this.canvas) return;

      try {
        // Update canvas size based on video dimensions
        const videoWidth = this.videoElement.videoWidth || 640;
        const videoHeight = this.videoElement.videoHeight || 480;
        
        if (videoWidth === 0 || videoHeight === 0) {
          // Video not ready yet, skip this frame
          return;
        }

        this.canvas.width = videoWidth;
        this.canvas.height = videoHeight;

        const context = this.canvas.getContext('2d');
        if (!context) return;

        context.drawImage(this.videoElement, 0, 0, videoWidth, videoHeight);

        const detections = await faceapi
          .detectAllFaces(this.canvas, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceExpressions()
          .withAgeAndGender();

        if (detections.length > 0) {
          const detection = detections[0]; // Use first face
          const expressions = detection.expressions;
          
          // Find dominant emotion
          const emotionMap: Record<string, 'happy' | 'sad' | 'neutral' | 'angry' | 'surprised' | 'fearful' | 'disgusted'> = {
            happy: 'happy',
            sad: 'sad',
            neutral: 'neutral',
            angry: 'angry',
            surprised: 'surprised',
            fearful: 'fearful',
            disgusted: 'disgusted'
          };

          const dominantEmotion = Object.entries(expressions)
            .sort(([, a], [, b]) => (b as number) - (a as number))[0][0] as keyof typeof emotionMap;

          const result: FaceAnalysisResult = {
            detected: true,
            age: Math.round(detection.age),
            gender: detection.gender as 'male' | 'female',
            emotion: emotionMap[dominantEmotion] || 'unknown',
            expressions: expressions as any,
            confidence: detection.detection.score,
            boundingBox: {
              x: detection.detection.box.x,
              y: detection.detection.box.y,
              width: detection.detection.box.width,
              height: detection.detection.box.height
            }
          };

          onAnalysis(result);
        } else {
          onAnalysis({ detected: false });
        }
      } catch (error) {
        console.error('Error during face analysis:', error);
        onAnalysis({ detected: false });
      }
    };

    // Start periodic analysis
    this.analysisInterval = window.setInterval(analyze, interval);
    // Initial analysis
    analyze();
  }

  stopAnalysis() {
    this.isAnalyzing = false;
    if (this.analysisInterval !== null) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }
    this.videoElement = null;
    if (this.canvas) {
      this.canvas = null;
    }
    console.log('Face analysis stopped');
  }

  isReady(): boolean {
    return this.modelsLoaded;
  }
}

