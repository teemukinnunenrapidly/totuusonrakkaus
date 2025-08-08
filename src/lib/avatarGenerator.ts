// Avatar generator for creating unique user avatars
// Based on user email or ID to ensure consistency

interface AvatarColors {
  background: string;
  text: string;
}

const avatarColors: AvatarColors[] = [
  { background: "#FF6B6B", text: "#FFFFFF" },
  { background: "#4ECDC4", text: "#FFFFFF" },
  { background: "#45B7D1", text: "#FFFFFF" },
  { background: "#96CEB4", text: "#FFFFFF" },
  { background: "#FFEAA7", text: "#2D3436" },
  { background: "#DDA0DD", text: "#FFFFFF" },
  { background: "#98D8C8", text: "#FFFFFF" },
  { background: "#F7DC6F", text: "#2D3436" },
  { background: "#BB8FCE", text: "#FFFFFF" },
  { background: "#85C1E9", text: "#FFFFFF" },
  { background: "#F8C471", text: "#2D3436" },
  { background: "#82E0AA", text: "#2D3436" },
  { background: "#F1948A", text: "#FFFFFF" },
  { background: "#85C1E9", text: "#FFFFFF" },
  { background: "#D7BDE2", text: "#2D3436" },
  { background: "#A9DFBF", text: "#2D3436" },
];

export const generateAvatar = (email: string | null, userId: string | null): string => {
  if (!email && !userId) {
    return generateDefaultAvatar();
  }

  const seed = email || userId || "default";
  const hash = simpleHash(seed);
  const colorIndex = hash % avatarColors.length;
  const colors = avatarColors[colorIndex];
  
  const initials = getInitials(email || userId || "");
  const size = 200;
  
  return generateSVGAvatar(initials, colors, size);
};

const simpleHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
};

const getInitials = (text: string): string => {
  if (!text) return "?";
  
  // Extract name from email if it's an email
  let name = text;
  if (text.includes("@")) {
    name = text.split("@")[0];
  }
  
  // Split by common separators and get first two characters
  const parts = name.split(/[._-]/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  
  // If single word, take first two characters
  if (name.length >= 2) {
    return name.substring(0, 2).toUpperCase();
  }
  
  return name.toUpperCase();
};

const generateSVGAvatar = (initials: string, colors: AvatarColors, size: number): string => {
  const fontSize = Math.max(size * 0.4, 24);
  const yOffset = size * 0.35;
  
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="${colors.background}" rx="${size * 0.1}"/>
      <text 
        x="${size / 2}" 
        y="${yOffset}" 
        font-family="Arial, sans-serif" 
        font-size="${fontSize}" 
        font-weight="bold" 
        text-anchor="middle" 
        fill="${colors.text}"
        dominant-baseline="middle"
      >
        ${initials}
      </text>
    </svg>
  `.replace(/\s+/g, " ").trim();
};

const generateDefaultAvatar = (): string => {
  const colors = avatarColors[0];
  return generateSVGAvatar("?", colors, 200);
};

// Helper function to convert SVG to data URL
export const svgToDataURL = (svg: string): string => {
  const encoded = encodeURIComponent(svg);
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
};

// Generate avatar data URL for direct use in img src
export const generateAvatarDataURL = (email: string | null, userId: string | null): string => {
  const svg = generateAvatar(email, userId);
  return svgToDataURL(svg);
};
