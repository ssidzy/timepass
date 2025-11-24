/**
 * StreamingManager
 * Handles video streaming, encoding, and HLS stream management
 */

const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

class StreamingManager {
  constructor() {
    this.activeStreams = new Map();
    this.videoProfiles = {
      '4k60': {
        resolution: '3840x2160',
        bitrate: '15000k',
        fps: 60,
        codec: 'libx264',
        preset: 'ultrafast'
      },
      '1080p60': {
        resolution: '1920x1080',
        bitrate: '5000k',
        fps: 60,
        codec: 'libx264',
        preset: 'ultrafast'
      },
      '720p60': {
        resolution: '1280x720',
        bitrate: '2500k',
        fps: 60,
        codec: 'libx264',
        preset: 'veryfast'
      },
      '480p30': {
        resolution: '854x480',
        bitrate: '1200k',
        fps: 30,
        codec: 'libx264',
        preset: 'veryfast'
      },
      '360p30': {
        resolution: '640x360',
        bitrate: '600k',
        fps: 30,
        codec: 'libx264',
        preset: 'fast'
      }
    };
  }

  /**
   * Start streaming with specified quality
   */
  startStream(streamId, quality = '1080p60') {
    const profile = this.videoProfiles[quality];
    if (!profile) {
      throw new Error(`Invalid quality profile: ${quality}`);
    }

    const streamData = {
      id: streamId,
      quality,
      profile,
      status: 'active',
      startTime: Date.now(),
      segments: [],
      bitrate: profile.bitrate
    };

    this.activeStreams.set(streamId, streamData);
    console.log(`Stream ${streamId} started with quality ${quality}`);
    return streamData;
  }

  /**
   * Stop streaming
   */
  stopStream(streamId) {
    if (this.activeStreams.has(streamId)) {
      this.activeStreams.delete(streamId);
      console.log(`Stream ${streamId} stopped`);
      return true;
    }
    return false;
  }

  /**
   * Create HLS segments (HTTP Live Streaming)
   * Divides video into small chunks for adaptive streaming
   */
  createHLSSegment(streamId, inputPath, segmentDuration = 2) {
    return new Promise((resolve, reject) => {
      const stream = this.activeStreams.get(streamId);
      if (!stream) {
        return reject(new Error('Stream not found'));
      }

      const outputDir = path.join(__dirname, `../../streams/${streamId}`);
      const playlistPath = path.join(outputDir, 'playlist.m3u8');
      const segmentPattern = path.join(outputDir, 'segment_%d.ts');

      // Ensure output directory exists
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const profile = stream.profile;
      
      ffmpeg(inputPath)
        .outputOptions([
          `-c:v ${profile.codec}`,
          `-preset ${profile.preset}`,
          `-b:v ${profile.bitrate}`,
          `-s ${profile.resolution}`,
          `-r ${profile.fps}`,
          `-c:a aac`,
          `-b:a 128k`,
          `-f hls`,
          `-hls_time ${segmentDuration}`,
          `-hls_list_size 10`,
          `-hls_flags delete_segments`,
          `-start_number 0`
        ])
        .output(segmentPattern)
        .on('end', () => {
          resolve({
            streamId,
            playlist: playlistPath,
            segments: stream.segments
          });
        })
        .on('error', (err) => {
          reject(err);
        })
        .run();
    });
  }

  /**
   * Transcode video to multiple quality profiles for adaptive streaming
   */
  transcodeMultiQuality(inputPath, streamId) {
    return new Promise((resolve, reject) => {
      const qualities = ['1080p60', '720p60', '480p30'];
      const outputDir = path.join(__dirname, `../../streams/${streamId}`);
      const profiles = {};

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      let completed = 0;

      qualities.forEach(quality => {
        const profile = this.videoProfiles[quality];
        const outputPath = path.join(outputDir, `${quality}.m3u8`);
        const segmentPattern = path.join(outputDir, `${quality}_segment_%d.ts`);

        ffmpeg(inputPath)
          .outputOptions([
            `-c:v ${profile.codec}`,
            `-preset ${profile.preset}`,
            `-b:v ${profile.bitrate}`,
            `-s ${profile.resolution}`,
            `-r ${profile.fps}`,
            `-c:a aac`,
            `-b:a 96k`,
            `-f hls`,
            `-hls_time 2`,
            `-hls_list_size 10`
          ])
          .output(segmentPattern)
          .on('end', () => {
            profiles[quality] = outputPath;
            completed++;
            if (completed === qualities.length) {
              resolve(profiles);
            }
          })
          .on('error', reject)
          .run();
      });
    });
  }

  /**
   * Get stream statistics
   */
  getStreamStats(streamId) {
    const stream = this.activeStreams.get(streamId);
    if (!stream) return null;

    const duration = Date.now() - stream.startTime;
    return {
      streamId,
      quality: stream.quality,
      duration,
      status: stream.status,
      bitrate: stream.bitrate,
      uptime: Math.floor(duration / 1000),
      segments: stream.segments.length
    };
  }

  /**
   * Get all active streams
   */
  getActiveStreams() {
    return Array.from(this.activeStreams.values());
  }

  /**
   * Update bitrate dynamically based on network conditions
   */
  updateBitrate(streamId, newBitrate) {
    const stream = this.activeStreams.get(streamId);
    if (stream) {
      stream.bitrate = newBitrate;
      return true;
    }
    return false;
  }
}

module.exports = StreamingManager;
