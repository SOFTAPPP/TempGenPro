import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  keywords?: string;
}

const SEO: React.FC<SEOProps> = ({ 
  title = "TempGenPro | Premium Temporary Email & Virtual Numbers", 
  description = "The world's most advanced temporary email generator. Protect your privacy with synthetic personas, AI camouflage, and secure social media relay nodes.",
  canonical = "https://tempgenpro.com",
  keywords = "temporary email, disposable email, anonymous email, temp mail, virtual whatsapp number, privacy protection, bypass social media verification"
}) => {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={canonical} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content="https://tempgenpro.com/og-image.jpg" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonical} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content="https://tempgenpro.com/og-image.jpg" />
    </Helmet>
  );
};

export default SEO;
