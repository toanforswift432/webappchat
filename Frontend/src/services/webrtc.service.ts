export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;

  private config: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
    ],
  };

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
      return this.localStream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  }

  createPeerConnection(
    onRemoteStream: (stream: MediaStream) => void,
    onIceCandidate: (candidate: RTCIceCandidate) => void
  ): RTCPeerConnection {
    this.peerConnection = new RTCPeerConnection(this.config);

    this.peerConnection.ontrack = (event) => {
      console.log('Remote track received:', event.track.kind);
      this.remoteStream = event.streams[0];
      onRemoteStream(this.remoteStream);
    };

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('ICE candidate generated');
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
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
  }

  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) throw new Error('Peer connection not initialized');
    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  }

  toggleVideo(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
  }

  toggleAudio(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
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
  }
}
