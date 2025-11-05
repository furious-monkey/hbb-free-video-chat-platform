// src/types/mediasoup.d.ts - TypeScript declarations for mediasoup-client
declare module 'mediasoup-client' {
    export class Device {
      constructor();
      loaded: boolean;
      rtpCapabilities: any;
      sctpCapabilities: any;
      
      load(options: { routerRtpCapabilities: any }): Promise<void>;
      canProduce(kind: 'audio' | 'video'): boolean;
      createSendTransport(options: any): Transport;
      createRecvTransport(options: any): Transport;
    }
  
    export interface Transport {
      id: string;
      closed: boolean;
      
      close(): void;
      
      on(event: 'connect', listener: (
        { dtlsParameters }: { dtlsParameters: any },
        callback: () => void,
        errback: (error: Error) => void
      ) => void): void;
      
      on(event: 'produce', listener: (
        parameters: { kind: 'audio' | 'video'; rtpParameters: any; appData?: any },
        callback: (params: { id: string }) => void,
        errback: (error: Error) => void
      ) => void): void;
      
      on(event: string, listener: (...args: any[]) => void): void;
      
      produce(options: {
        track: MediaStreamTrack;
        encodings?: any[];
        codecOptions?: any;
        appData?: any;
      }): Promise<Producer>;
      
      consume(options: {
        id: string;
        producerId: string;
        kind: 'audio' | 'video';
        rtpParameters: any;
        appData?: any;
      }): Promise<Consumer>;
    }
  
    export interface Producer {
      id: string;
      closed: boolean;
      kind: 'audio' | 'video';
      track: MediaStreamTrack;
      
      close(): void;
      pause(): void;
      resume(): void;
      
      on(event: string, listener: (...args: any[]) => void): void;
    }
  
    export interface Consumer {
      id: string;
      producerId: string;
      closed: boolean;
      kind: 'audio' | 'video';
      track: MediaStreamTrack;
      rtpParameters: any;
      type: string;
      producerPaused: boolean;
      paused: boolean;
      
      close(): void;
      pause(): void;
      resume(): void;
      getStats(): Promise<any[]>;
      setPreferredLayers?(layers: { spatialLayer?: number; temporalLayer?: number }): Promise<void>;
      
      on(event: string, listener: (...args: any[]) => void): void;
    }
  }