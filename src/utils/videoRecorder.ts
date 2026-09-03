import html2canvas from 'html2canvas';

export class ElementVideoRecorder {
  private element: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private isRecording: boolean = false;
  private animFrameId: number | null = null;

  constructor(element: HTMLElement) {
    this.element = element;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  public async start(): Promise<void> {
    this.recordedChunks = [];
    this.isRecording = true;

    // Set canvas dimensions based on element
    const rect = this.element.getBoundingClientRect();
    this.canvas.width = Math.round(rect.width) * 2; // High DPI 2x
    this.canvas.height = Math.round(rect.height) * 2;

    const stream = this.canvas.captureStream(30); // 30 FPS

    let mimeType = 'video/webm;codecs=vp9';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm;codecs=vp8';
    }
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm';
    }

    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 5000000, // 5 Mbps quality
    });

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    this.mediaRecorder.start(100); // 100ms slice chunks

    // Continuous frame capture loop
    const captureLoop = async () => {
      if (!this.isRecording) return;

      try {
        const renderCanvas = await html2canvas(this.element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: null,
        });

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(renderCanvas, 0, 0);
      } catch (e) {
        console.warn('Frame render error:', e);
      }

      if (this.isRecording) {
        setTimeout(captureLoop, 33); // ~30 fps
      }
    };

    captureLoop();
  }

  public stopAndDownload(filename: string = 'Merge_Sort_Animation.webm'): Promise<void> {
    return new Promise((resolve) => {
      this.isRecording = false;

      if (!this.mediaRecorder) {
        resolve();
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }, 100);
        resolve();
      };

      this.mediaRecorder.stop();
    });
  }
}
