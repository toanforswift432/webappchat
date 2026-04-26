import axiosInstance from './axios';

interface TurnCredentialsResponse {
  iceServers: RTCIceServer[];
}

export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;

  // ICE candidates received before peer connection / remote description is ready
  private pendingIceCandidates: RTCIceCandidateInit[] = [];

  // Prevents double setRemoteDescription when both useCall instances handle call-answered
  private remoteAnswerSet = false;

  private onRemoteStreamCallback: ((stream: MediaStream) => void) | null = null;
  private onLocalStreamCallback: ((stream: MediaStream) => void) | null = null;

  private baseIceServers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ];

  private async buildConfig(): Promise<RTCConfiguration> {
    try {
      const res = await axiosInstance.get<TurnCredentialsResponse>('/turn/credentials');
      const turnServers = res.data.iceServers ?? [];
      return { iceServers: [...this.baseIceServers, ...turnServers] };
    } catch {
      return { iceServers: this.baseIceServers };
    }
  }

  updateStreamCallbacks(
    onRemoteStream: (stream: MediaStream) => void,
    onLocalStream?: (stream: MediaStream) => void
  ): void {
    this.onRemoteStreamCallback = onRemoteStream;
    if (onLocalStream) this.onLocalStreamCallback = onLocalStream;

    // Deliver any streams that arrived before the modal mounted
    if (this.localStream && this.onLocalStreamCallback) {
      this.onLocalStreamCallback(this.localStream);
    }
    if (this.remoteStream && this.onRemoteStreamCallback) {
      this.onRemoteStreamCallback(this.remoteStream);
    }
  }

  async initializeLocalStream(video: boolean = true): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: video ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      this.onLocalStreamCallback?.(this.localStream);
      window.dispatchEvent(new CustomEvent('webrtc-local-stream', { detail: this.localStream }));
      return this.localStream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  }

  async createPeerConnection(
    onIceCandidate: (candidate: RTCIceCandidate) => void
  ): Promise<RTCPeerConnection> {
    const config = await this.buildConfig();
    this.peerConnection = new RTCPeerConnection(config);

    this.peerConnection.ontrack = (event) => {
      console.log('Remote track received:', event.track.kind);
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
      } else {
        // Always create a new MediaStream object so srcObject assignment is always detected as a change
        const existingTracks = this.remoteStream ? this.remoteStream.getTracks() : [];
        this.remoteStream = new MediaStream([...existingTracks, event.track]);
      }
      this.onRemoteStreamCallback?.(this.remoteStream);
      // Dispatch DOM event so VideoCallModal can apply srcObject immediately
      // regardless of React render cycle timing
      window.dispatchEvent(new CustomEvent('webrtc-remote-stream', { detail: this.remoteStream }));
    };

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('ICE candidate generated:', event.candidate.type);
        onIceCandidate(event.candidate);
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', this.peerConnection?.connectionState);
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', this.peerConnection?.iceConnectionState);
    };

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        console.log('Adding local track:', track.kind);
        this.peerConnection!.addTrack(track, this.localStream!);
      });
    }

    return this.peerConnection;
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) throw new Error('Peer connection not initialized');

    const offer = await this.peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });
    await this.peerConnection.setLocalDescription(offer);
    return offer;
  }

  async createAnswer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) throw new Error('Peer connection not initialized');

    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    return answer;
  }

  async setRemoteDescription(sdp: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) throw new Error('Peer connection not initialized');
    // JS is single-threaded: check+set flag is atomic before the first await,
    // so this reliably blocks the duplicate call-answered handler.
    if (sdp.type === 'answer') {
      if (this.remoteAnswerSet) {
        console.log('Remote answer already applied, skipping duplicate setRemoteDescription');
        return;
      }
      this.remoteAnswerSet = true;
    }
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
    await this.flushPendingCandidates();
  }

  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    // Buffer the candidate if peer connection or remote description not ready
    if (!this.peerConnection || !this.peerConnection.remoteDescription) {
      console.log('Buffering ICE candidate (peer not ready yet)');
      this.pendingIceCandidates.push(candidate);
      return;
    }
    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  }

  private async flushPendingCandidates(): Promise<void> {
    if (this.pendingIceCandidates.length === 0) return;
    console.log(`Flushing ${this.pendingIceCandidates.length} buffered ICE candidates`);
    const candidates = [...this.pendingIceCandidates];
    this.pendingIceCandidates = [];
    for (const candidate of candidates) {
      try {
        await this.peerConnection!.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error('Error adding buffered ICE candidate:', error);
      }
    }
  }

  toggleVideo(enabled: boolean): void {
    console.log(`[WebRTC] toggleVideo(${enabled})`);
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = enabled;
        console.log(`[WebRTC] localStream video track.enabled = ${track.enabled}`);
      });
    }
    if (this.peerConnection) {
      this.peerConnection.getSenders()
        .filter((s) => s.track?.kind === 'video')
        .forEach((s) => {
          if (s.track) {
            s.track.enabled = enabled;
            console.log(`[WebRTC] sender video track.enabled = ${s.track.enabled}`);
          }
        });
    }
  }

  toggleAudio(enabled: boolean): void {
    console.log(`[WebRTC] toggleAudio(${enabled}), localStream=${!!this.localStream}, pc=${!!this.peerConnection}`);
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = enabled;
        console.log(`[WebRTC] localStream audio track.enabled = ${track.enabled}, readyState=${track.readyState}`);
      });
    }
    if (this.peerConnection) {
      this.peerConnection.getSenders()
        .filter((s) => s.track?.kind === 'audio')
        .forEach((s) => {
          if (s.track) {
            s.track.enabled = enabled;
            console.log(`[WebRTC] sender audio track.enabled = ${s.track.enabled}`);
          }
        });
    }
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  getPeerConnection(): RTCPeerConnection | null {
    return this.peerConnection;
  }

  cleanup(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    this.remoteStream = null;
    this.pendingIceCandidates = [];
    this.remoteAnswerSet = false;
    this.onLocalStreamCallback = null;
    this.onRemoteStreamCallback = null;
  }
}

// Singleton instance shared across all useCall hooks
let sharedWebRTCService: WebRTCService | null = null;

export function getWebRTCService(): WebRTCService {
  if (!sharedWebRTCService) {
    sharedWebRTCService = new WebRTCService();
  }
  return sharedWebRTCService;
}

export function resetWebRTCService(): void {
  if (sharedWebRTCService) {
    sharedWebRTCService.cleanup();
    sharedWebRTCService = null;
  }
}
