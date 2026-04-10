import React from 'react';
import bgVideo from '../assets/bg.mp4';

const VideoBackground: React.FC = () => {
  return (
    <div className="video-bg-container">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="video-bg"
      >
        <source src={bgVideo} type="video/mp4" />
      </video>
      <div className="video-overlay"></div>
      <style>{`
        .video-bg-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: -2;
          overflow: hidden;
          background: #08060d; /* Fallback color */
        }

        .video-bg {
          min-width: 100%;
          min-height: 100%;
          width: auto;
          height: auto;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          object-fit: cover;
          opacity: 0.5;
          filter: brightness(0.7) blur(12px); /* Translucent frost effect */
        }

        .video-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle at center, transparent 0%, rgba(3, 7, 18, 0.6) 100%);
          z-index: -1;
          backdrop-filter: blur(4px); /* Extra layer of translucent depth */
        }
      `}</style>
    </div>
  );
};

export default VideoBackground;
